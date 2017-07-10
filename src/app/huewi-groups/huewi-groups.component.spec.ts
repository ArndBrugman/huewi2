import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HuewiGroupsComponent } from './huewi-groups.component';

describe('HuewiGroupsComponent', () => {
  let component: HuewiGroupsComponent;
  let fixture: ComponentFixture<HuewiGroupsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HuewiGroupsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HuewiGroupsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
