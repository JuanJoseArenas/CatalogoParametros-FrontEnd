import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { DatePipe, JsonPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subscription, finalize, forkJoin } from 'rxjs';
import { HttpTokensRepository } from '../../infrastructure/http-tokens.repository';
import { HttpAplicacionesRepository } from '../../../aplicaciones/infrastructure/http-aplicaciones.repository';
import { HttpAmbientesRepository } from '../../../ambientes/infrastructure/http-ambientes.repository';
import { Aplicacion } from '../../../aplicaciones/domain/aplicacion';
import { Ambiente } from '../../../ambientes/domain/ambiente';
import { Token } from '../../domain/token';
import { ParametrosTokenResponse } from '../../domain/parametros-token';
import { TokenEntityDetailsComponent } from './token-entity-details.component';
import { PageMessagesComponent } from '../../../../shared/ui/page-messages/page-messages.component';
import { loadAllPages } from '../../../../shared/utils/load-all-pages';
@Component({ selector:'app-consulta-parametros', imports:[FormsModule, DatePipe, JsonPipe, TokenEntityDetailsComponent, PageMessagesComponent], templateUrl:'./consulta-parametros.component.html', changeDetection:ChangeDetectionStrategy.Eager,
styles:[`:host { display:block; max-width:1200px; margin:auto; } .card { margin-bottom:20px; } .query-form { padding:24px; } .metadata-value { white-space:pre-wrap; overflow-wrap:anywhere; margin:8px 0; font-family:inherit; } summary { cursor:pointer; font-weight:600; padding:16px 0; }`] })
export class ConsultaParametrosComponent implements OnInit, OnDestroy {
  tokens: Token[] = []; aplicaciones: Aplicacion[] = []; ambientes: Ambiente[] = [];
  tokenId = ''; secreto = ''; loading = false; busy = false; errorMessage = '';
  parametros: ParametrosTokenResponse | null = null;
  private readonly subscriptions = new Subscription();
  constructor(private readonly repository:HttpTokensRepository, private readonly apps:HttpAplicacionesRepository, private readonly environments:HttpAmbientesRepository, private readonly route:ActivatedRoute) {}
  ngOnInit() {
    this.tokenId = this.route.snapshot.queryParamMap.get('token') ?? '';
    this.load();
  }
  ngOnDestroy() { this.subscriptions.unsubscribe(); this.secreto = ''; }
  appName(id:string) { return this.aplicaciones.find(a => a.id === id)?.nombre ?? 'Aplicación no disponible'; }
  environmentName(id:string) { return this.ambientes.find(a => a.id === id)?.nombre ?? 'Ambiente no disponible'; }
  load() {
    if (this.loading || this.busy) return;
    this.loading = true; this.errorMessage = '';
    this.subscriptions.add(forkJoin({ tokens:this.repository.findAll(), aplicaciones:loadAllPages((p,s) => this.apps.findPage(p,s)), ambientes:loadAllPages((p,s) => this.environments.findPage(p,s)) }).pipe(finalize(() => this.loading = false)).subscribe({ next:data => { Object.assign(this,data); if (!this.tokens.some(t => t.id === this.tokenId)) this.tokenId = ''; }, error:(e:Error) => this.errorMessage = e.message }));
  }
  clearResult() { this.parametros = null; this.secreto = ''; this.errorMessage = ''; }
  parameters() {
    if (this.busy || this.loading || !this.tokenId || !this.secreto.trim()) return;
    const secret = this.secreto.trim(); this.secreto = ''; this.parametros = null; this.errorMessage = ''; this.busy = true;
    this.subscriptions.add(this.repository.findParameters(this.tokenId,secret).pipe(finalize(() => this.busy = false)).subscribe({ next:response => this.parametros = response, error:(e:Error) => this.errorMessage = e.message }));
  }
}
