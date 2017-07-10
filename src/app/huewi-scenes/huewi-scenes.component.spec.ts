import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HuewiScenesComponent } from './huewi-scenes.component';

describe('HuewiScenesComponent', () => {
  let component: HuewiScenesComponent;
  let fixture: ComponentFixture<HuewiScenesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HuewiScenesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HuewiScenesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
