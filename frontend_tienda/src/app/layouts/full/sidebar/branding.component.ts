import { Component, OnInit } from '@angular/core';
import { CoreService } from 'src/app/services/core.service';
import { ConfigService } from 'src/app/services/config.service';

@Component({
  selector: 'app-branding',
  template: `
    <div class="branding-container">
      <span class="tenant-name">{{ tenantName }}</span>
    </div>
  `,
  styles: [`
    .branding-container {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 8px;
      margin: 12px;
    }

    .tenant-name {
      font-weight: 700;
      font-size: 18px;
      color: white;
      text-align: center;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      letter-spacing: 0.5px;
      white-space: normal;
      word-wrap: break-word;
    }
  `]
})
export class BrandingComponent implements OnInit {
  options = this.settings.getOptions();
  tenantName: string = '';

  constructor(
    private settings: CoreService,
    private configService: ConfigService
  ) {}

  ngOnInit(): void {
    this.tenantName = this.formatTenantName();
  }

  /**
   * Formatear el nombre del tenant
   * Ejemplos:
   * - tienda-amiga → Tienda Amiga
   * - empresa-xyz → Empresa Xyz
   * - null (localhost) → [Desarrollo Local]
   */
  private formatTenantName(): string {
    const tenant = this.configService.getCurrentTenant();
    
    if (!tenant) {
      return '[Desarrollo Local]';
    }

    return tenant
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
}
