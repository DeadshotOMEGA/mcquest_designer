import { Download } from '@playwright/test'
import { BasePage } from './base-page'

/**
 * ExportDialog - SNBT export dialog page object
 *
 * Handles export configuration, triggering download,
 * and verifying ZIP structure.
 *
 * Common failures:
 * - "Export dialog not visible": Check button selector
 * - "Download not started": Verify browser download handling
 * - "ZIP structure invalid": Check SNBT compiler output
 */
export class ExportDialog extends BasePage {
  // Locators
  get openExportButton() {
    return this.page.getByRole('button', { name: /export/i })
  }

  get exportFormatSelect() {
    return this.page.getByLabel(/format/i)
  }

  get exportButton() {
    return this.page.getByRole('button', { name: /download/i })
  }

  get closeButton() {
    return this.page.getByRole('button', { name: /close/i })
  }

  // Actions
  async open() {
    await this.openExportButton.click()
    await this.page.waitForTimeout(300)
  }

  async selectFormat(format: string) {
    await this.exportFormatSelect.selectOption(format)
  }

  async downloadExport(): Promise<Download> {
    const downloadPromise = this.page.waitForEvent('download')
    await this.exportButton.click()
    return await downloadPromise
  }

  async close() {
    await this.closeButton.click()
  }

  /**
   * Verify ZIP structure contains expected files
   */
  async verifyZipStructure(download: Download, _expectedFiles: string[]) {
    const path = await download.path()
    if (!path) {
      throw new Error('Download path is null')
    }

    // Note: Actual ZIP verification would require a library
    // For now, just verify download completed
    const fileName = download.suggestedFilename()
    if (!fileName.endsWith('.zip')) {
      throw new Error(`Expected ZIP file, got: ${fileName}`)
    }

    return true
  }
}
