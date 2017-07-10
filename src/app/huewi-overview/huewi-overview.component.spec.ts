import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HuewiOverviewComponent } from './huewi-overview.component';

describe('HuewiOverviewComponent', () => {
  let component: HuewiOverviewComponent;
  let fixture: ComponentFixture<HuewiOverviewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HuewiOverviewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HuewiOverviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
