import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Organizacion } from '../../domain/organizacion';
import { OrganizacionesTableComponent } from './organizaciones-table.component';

describe('OrganizacionesTableComponent', () => {
  let fixture: ComponentFixture<OrganizacionesTableComponent>;
  const organizacion: Organizacion = { id: '1', nombre: 'UCO', fechaInicio: '2026-01-01' };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [OrganizacionesTableComponent] }).compileComponents();
    fixture = TestBed.createComponent(OrganizacionesTableComponent);
    fixture.componentRef.setInput('organizaciones', [organizacion]);
    fixture.componentRef.setInput('page', 1);
    fixture.componentRef.setInput('pageSize', 10);
    fixture.componentRef.setInput('totalOnPage', 1);
    fixture.detectChanges();
  });

  it('presenta las organizaciones', () => {
    expect(fixture.nativeElement.textContent).toContain('UCO');
  });

  it('emite las acciones de edición y eliminación', () => {
    const edited: Organizacion[] = [];
    const removed: string[] = [];
    fixture.componentInstance.edit.subscribe(value => edited.push(value));
    fixture.componentInstance.remove.subscribe(value => removed.push(value));

    const buttons = fixture.nativeElement.querySelectorAll('button');
    buttons[0].click();
    buttons[1].click();

    expect(edited).toEqual([organizacion]);
    expect(removed).toEqual(['1']);
  });

  it('presenta el estado vacío', () => {
    fixture.componentRef.setInput('organizaciones', []);
    fixture.componentRef.setInput('totalOnPage', 0);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No hay organizaciones');
  });
});
