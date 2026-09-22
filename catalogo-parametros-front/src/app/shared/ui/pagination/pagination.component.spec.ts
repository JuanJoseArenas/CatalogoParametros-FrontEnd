import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PaginationComponent } from './pagination.component';

describe('PaginationComponent', () => {
  let fixture: ComponentFixture<PaginationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [PaginationComponent] }).compileComponents();
    fixture = TestBed.createComponent(PaginationComponent);
    fixture.componentRef.setInput('page', 2);
    fixture.componentRef.setInput('hasNext', true);
    fixture.detectChanges();
  });

  it('emite la página seleccionada', () => {
    const emitted: number[] = [];
    fixture.componentInstance.pageChange.subscribe(page => emitted.push(page));

    fixture.componentInstance.select(3);

    expect(emitted).toEqual([3]);
  });

  it('ignora páginas menores que uno', () => {
    const emitted: number[] = [];
    fixture.componentInstance.pageChange.subscribe(page => emitted.push(page));

    fixture.componentInstance.select(0);

    expect(emitted).toEqual([]);
  });
});
