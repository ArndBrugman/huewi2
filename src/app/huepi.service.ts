import { Injectable } from '@angular/core';
import * as axios from 'axios'
import { huepi } from 'assets/huepi.js';

@Injectable()
export class HuepiService {
  private MyHue;
  
  groups : Array<any>;
  lights : Array<any>;
  rules : Array<any>;
  scenes : Array<any>;
  schedules : Array<any>;
  sensors : Array<any>;

  constructor() {
    this.MyHue = new huepi();

    this.MyHue.Lights['1'] = {name: 'Demo Light'};
    this.MyHue.Lights['2'] = {name: 'Living Light'};
    this.MyHue.Lights['3'] = {name: 'Dining Light'};
    this.MyHue.Groups['1'] = {name: 'Demo Group', type: 'LightGroup'};
    this.MyHue.Groups['2'] = {name: 'Living Group', type: 'LightGroup'};
    this.MyHue.Groups['3'] = {name: 'Dining Group', type: 'LightGroup'};
    this.MyHue.Groups['11'] = {name: 'Demo Room', type: 'Room'};
    this.MyHue.Groups['12'] = {name: 'Living Room', type: 'Room'};
    this.MyHue.Groups['13'] = {name: 'Dining Room', type: 'Room'};
    this.MyHue.Groups['1'].lights=this.MyHue.Groups['2'].lights=this.MyHue.Groups['3'].lights=["1","2"];
    this.MyHue.Groups['11'].lights=this.MyHue.Groups['12'].lights=this.MyHue.Groups['13'].lights=["1","2"];
    this.MyHue.Lights['1'].state={'on':true,'bri':141,'xy':[0.5,0.4],'colormode':'xy','reachable':true};
    this.MyHue.Lights['2'].state={'on':true,'bri':152,'xy':[0.4,0.5],'colormode':'xy','reachable':true};
    this.MyHue.Lights['3'].state={'on':true,'bri':163,'xy':[0.5,0.5],'colormode':'xy','reachable':true};
    this.MyHue.Groups['1'].action={'on':true,'bri':131,'xy':[0.5,0.4],'colormode':'xy','reachable':true};
    this.MyHue.Groups['2'].action={'on':true,'bri':142,'xy':[0.4,0.5],'colormode':'xy','reachable':true};
    this.MyHue.Groups['3'].action={'on':true,'bri':153,'xy':[0.5,0.5],'colormode':'xy','reachable':true};
    this.MyHue.Groups['11'].action={'on':true,'bri':161,'xy':[0.5,0.4],'colormode':'xy','reachable':true};
    this.MyHue.Groups['12'].action={'on':true,'bri':172,'xy':[0.4,0.5],'colormode':'xy','reachable':true};
    this.MyHue.Groups['13'].action={'on':true,'bri':183,'xy':[0.5,0.5],'colormode':'xy','reachable':true};
    this.update();
    
    setInterval( () => { this.update()}, 666);
  }

  update () {
    console.log('Update', JSON.stringify(this.MyHue));
    
    let groups = [];
    if (this.MyHue.Groups) {
      Object.keys(this.MyHue.Groups).forEach((key) => {
  this.MyHue.Groups[key].action.bri = 3 * Date.now() % 255;
        groups.push(this.MyHue.Groups[key]);
      })
    }
    this.groups = groups;

    let lights = [];
    if (this.MyHue.Lights) {
      Object.keys(this.MyHue.Lights).forEach((key) => {
  this.MyHue.Lights[key].state.bri = 777 * Date.now() % 255;
        lights.push(this.MyHue.Lights[key]);
      })
    }
    this.lights = lights;
  }
}
