import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HuewiLightComponent } from './huewi-light.component';

describe('HuewiLightComponent', () => {
  let component: HuewiLightComponent;
  let fixture: ComponentFixture<HuewiLightComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HuewiLightComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HuewiLightComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
