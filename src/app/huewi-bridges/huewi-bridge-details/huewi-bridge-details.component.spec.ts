import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HuewiBridgeDetailsComponent } from './huewi-bridge-details.component';

describe('HuewiBridgeDetailsComponent', () => {
  let component: HuewiBridgeDetailsComponent;
  let fixture: ComponentFixture<HuewiBridgeDetailsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HuewiBridgeDetailsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HuewiBridgeDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
