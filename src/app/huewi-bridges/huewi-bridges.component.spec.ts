import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HuewiBridgesComponent } from './huewi-bridges.component';

describe('HuewiBridgesComponent', () => {
  let component: HuewiBridgesComponent;
  let fixture: ComponentFixture<HuewiBridgesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HuewiBridgesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HuewiBridgesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
