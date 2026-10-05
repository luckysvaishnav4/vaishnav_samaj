import { provideHttpClient } from '@angular/common/http';
import { inject, provideAppInitializer } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { CommunityApiService } from './app/core/services/community-api.service';

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(),
    provideAppInitializer(() => inject(CommunityApiService).initialize()),
    provideRouter(routes, withInMemoryScrolling({
      scrollPositionRestoration: 'top',
      anchorScrolling: 'enabled'
    }))
  ]
}).catch((error: unknown) => console.error(error));
