import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HuewiSceneDetailsComponent } from './huewi-scene-details.component';

describe('HuewiSceneDetailsComponent', () => {
  let component: HuewiSceneDetailsComponent;
  let fixture: ComponentFixture<HuewiSceneDetailsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HuewiSceneDetailsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HuewiSceneDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
