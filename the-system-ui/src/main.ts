import { bootstrapApplication } from '@angular/platform-browser';
import { Chart, registerables } from 'chart.js';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

// Register all Chart.js controllers, elements, scales and plugins
Chart.register(...registerables);

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
