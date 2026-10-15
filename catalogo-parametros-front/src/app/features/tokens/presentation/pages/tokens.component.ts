import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable, Subscription, finalize, forkJoin } from 'rxjs';
import { HttpTokensRepository } from '../../infrastructure/http-tokens.repository';
import { EstadoToken, Token } from '../../domain/token';
import { Aplicacion } from '../../../aplicaciones/domain/aplicacion';
import { Ambiente } from '../../../ambientes/domain/ambiente';
import { HttpAplicacionesRepository } from '../../../aplicaciones/infrastructure/http-aplicaciones.repository';
import { HttpAmbientesRepository } from '../../../ambientes/infrastructure/http-ambientes.repository';
import { loadAllPages } from '../../../../shared/utils/load-all-pages';
import { PageMessagesComponent } from '../../../../shared/ui/page-messages/page-messages.component';
@Component({ selector: 'app-tokens', imports: [RouterLink, DatePipe, FormsModule, ReactiveFormsModule, PageMessagesComponent], templateUrl: './tokens.component.html', changeDetection: ChangeDetectionStrategy.Eager,
styles: [`:host { display:block; max-width:1200px; margin:auto; } .actions { display:flex; gap:8px; flex-wrap:wrap; } td, dd { overflow-wrap:anywhere; } .card { margin-bottom:20px; }`] })
export class TokensComponent implements OnInit, OnDestroy {
  tokens: Token[] = []; estados: EstadoToken[] = []; aplicaciones: Aplicacion[] = []; ambientes: Ambiente[] = [];
  loading = false; busy = false; ready = false; showCreate = false; search = ''; errorMessage = ''; successMessage = '';
  selected: Token | null = null; estado = ''; secreto = '';
  readonly form = new FormGroup({
    token: new FormControl('', { nonNullable:true, validators:[Validators.required, Validators.pattern(/\S/)] }),
    estadoToken: new FormControl('', { nonNullable:true, validators:Validators.required }),
    aplicacionId: new FormControl('', { nonNullable:true, validators:Validators.required }),
    ambienteId: new FormControl('', { nonNullable:true, validators:Validators.required }),
    fechaExpiracion: new FormControl('', { nonNullable:true, validators:Validators.required })
  });
  private readonly subscriptions = new Subscription();
  constructor(private readonly repository: HttpTokensRepository, private readonly apps: HttpAplicacionesRepository, private readonly environments: HttpAmbientesRepository) {}
  ngOnInit() { this.load(); }
  ngOnDestroy() { this.subscriptions.unsubscribe(); this.secreto = ''; this.form.reset(); }
  get filteredTokens() { const term = this.search.trim().toLocaleLowerCase(); return this.tokens.filter(t => [t.id, this.appName(t.aplicacionId), this.environmentName(t.ambienteId), this.stateName(t.estadoToken)].some(v => v.toLocaleLowerCase().includes(term))); }
  appName(id:string) { return this.aplicaciones.find(a => a.id === id)?.nombre ?? id; }
  environmentName(id:string) { return this.ambientes.find(a => a.id === id)?.nombre ?? id; }
  stateName(id:string) { return this.estados.find(a => a.id === id)?.estado ?? id; }
  load() {
    if (this.loading) return;
    this.loading = true; this.errorMessage = '';
    this.subscriptions.add(forkJoin({ tokens:this.repository.findAll(), estados:this.repository.findStates(), aplicaciones:loadAllPages((p,s) => this.apps.findPage(p,s)), ambientes:loadAllPages((p,s) => this.environments.findPage(p,s)) }).pipe(finalize(() => this.loading = false)).subscribe({ next: data => { Object.assign(this, data); this.ready = true; }, error: (e:Error) => this.errorMessage = e.message }));
  }
  run<T>(request: Observable<T>, done:(value:T) => void) {
    if (this.busy) return;
    this.busy = true; this.errorMessage = ''; this.successMessage = '';
    this.subscriptions.add(request.pipe(finalize(() => this.busy = false)).subscribe({ next:done, error:(e:Error) => this.errorMessage = e.message }));
  }
  create() {
    this.form.markAllAsTouched(); if (this.form.invalid || this.busy) return;
    const value = this.form.getRawValue();
    if (value.fechaExpiracion && new Date(value.fechaExpiracion).getTime() <= Date.now()) { this.errorMessage = 'La expiración debe ser posterior a la fecha actual.'; return; }
    this.run(this.repository.create({ ...value, token:value.token.trim(), fechaExpiracion:value.fechaExpiracion ? `${value.fechaExpiracion}:00` : null }), response => {
      this.successMessage = response.mensajes[0] || 'Token creado.'; this.closeCreate(); this.load();
    });
  }
  closeCreate() { this.showCreate = false; this.form.reset(); }
  detail(id:string) { this.run(this.repository.findById(id), token => { this.selected = token; this.estado = token.estadoToken; this.secreto = ''; }); }
  closeDetail() { this.selected = null; this.secreto = ''; }
  changeState() { if (!this.selected || !this.estado) return; this.run(this.repository.changeState(this.selected.id,this.estado), response => { this.selected = response.tokens[0]; this.secreto = ''; this.successMessage = response.mensajes[0] || 'Estado actualizado.'; this.load(); }); }
  validate() { if (!this.selected || !this.secreto.trim()) return; const secret = this.secreto.trim(); this.secreto = ''; this.run(this.repository.validate(this.selected.id,secret), valid => { if (valid) this.successMessage = 'El token es válido.'; else this.errorMessage = 'El token no es válido, está inactivo, revocado o expirado.'; }); }
}
