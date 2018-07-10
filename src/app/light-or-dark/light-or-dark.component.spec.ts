import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LightOrDarkComponent } from './light-or-dark.component';

describe('LightOrDarkComponent', () => {
  let component: LightOrDarkComponent;
  let fixture: ComponentFixture<LightOrDarkComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LightOrDarkComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LightOrDarkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
