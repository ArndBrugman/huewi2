import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HuewiMenuComponent } from './huewi-menu.component';

describe('HuewiMenuComponent', () => {
  let component: HuewiMenuComponent;
  let fixture: ComponentFixture<HuewiMenuComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HuewiMenuComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HuewiMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
