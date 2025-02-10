import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { DemoComponent } from './app/components/demo/demo.component';

@Component({
  selector: 'app-root',
  template: `<app-demo></app-demo>`,
  imports: [DemoComponent],
})
export class App {
  name = 'Angular';
}

bootstrapApplication(App);
