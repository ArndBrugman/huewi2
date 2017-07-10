import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HuewiAboutComponent } from './huewi-about.component';

describe('HuewiAboutComponent', () => {
  let component: HuewiAboutComponent;
  let fixture: ComponentFixture<HuewiAboutComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HuewiAboutComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HuewiAboutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
