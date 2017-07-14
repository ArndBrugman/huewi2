import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HuewiRuleDetailsComponent } from './huewi-rule-details.component';

describe('HuewiRuleDetailsComponent', () => {
  let component: HuewiRuleDetailsComponent;
  let fixture: ComponentFixture<HuewiRuleDetailsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HuewiRuleDetailsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HuewiRuleDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
