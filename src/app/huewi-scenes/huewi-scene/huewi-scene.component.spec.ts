import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HuewiSceneComponent } from './huewi-scene.component';

describe('HuewiSceneComponent', () => {
  let component: HuewiSceneComponent;
  let fixture: ComponentFixture<HuewiSceneComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HuewiSceneComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HuewiSceneComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
