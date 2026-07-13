import { bootstrapApplication } from '@angular/platform-browser';
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';

import { AppComponent } from './app/app.component';
import { HeroService } from './app/hero.service';

bootstrapApplication(AppComponent, {
  providers: [HeroService, provideHttpClient(withInterceptorsFromDi())],
}).catch((err) => console.log(err));
