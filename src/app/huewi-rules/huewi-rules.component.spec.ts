import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HuewiRulesComponent } from './huewi-rules.component';

describe('HuewiRulesComponent', () => {
  let component: HuewiRulesComponent;
  let fixture: ComponentFixture<HuewiRulesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HuewiRulesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HuewiRulesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
