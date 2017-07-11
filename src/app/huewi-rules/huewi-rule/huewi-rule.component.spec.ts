import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HuewiRuleComponent } from './huewi-rule.component';

describe('HuewiRuleComponent', () => {
  let component: HuewiRuleComponent;
  let fixture: ComponentFixture<HuewiRuleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HuewiRuleComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HuewiRuleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
