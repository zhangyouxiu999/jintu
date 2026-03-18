import type { Page } from '@playwright/test'

export async function installFixedDate(page: Page, isoString: string) {
  await page.addInitScript((iso) => {
    const fixed = new Date(iso).valueOf()
    const OriginalDate = Date

    class MockDate extends OriginalDate {
      constructor(...args: ConstructorParameters<typeof Date>) {
        if (args.length === 0) {
          super(fixed)
        } else {
          super(...args)
        }
      }

      static now() {
        return fixed
      }
    }

    MockDate.UTC = OriginalDate.UTC
    MockDate.parse = OriginalDate.parse

    // @ts-expect-error override for test
    window.Date = MockDate
  }, isoString)
}
