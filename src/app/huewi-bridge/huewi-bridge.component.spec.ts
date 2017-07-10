import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HuewiBridgeComponent } from './huewi-bridge.component';

describe('HuewiBridgeComponent', () => {
  let component: HuewiBridgeComponent;
  let fixture: ComponentFixture<HuewiBridgeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HuewiBridgeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HuewiBridgeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
