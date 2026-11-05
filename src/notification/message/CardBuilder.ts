import {
  type CardColorTheme,
  type CardButtonType,
  type CardElement,
  type CardHeader,
  type CardActionItem,
  type FeishuCardPayload,
} from './types';

export class CardBuilder {
  private header?: CardHeader | undefined;
  private elements: CardElement[] = [];
  private currentActionGroup: CardActionItem[] = [];
  private wideScreenMode = true;

  /**
   * Sets the card header title and visual color theme.
   */
  setTitle(title: string, color?: CardColorTheme): this {
    this.header = {
      title: {
        tag: 'plain_text',
        content: title,
      },
      ...(color !== undefined && { template: color }),
    };
    return this;
  }

  /**
   * Appends a markdown content block.
   */
  addMarkdown(markdown: string): this {
    this.flushActions();
    this.elements.push({
      tag: 'div',
      text: {
        tag: 'lark_md',
        content: markdown,
      },
    });
    return this;
  }

  /**
   * Appends a formatted field (e.g., "**Label**: Value").
   */
  addField(label: string, value: string): this {
    return this.addMarkdown(`**${label}**\n${value}`);
  }

  /**
   * Appends multiple fields arranged as two columns if short.
   */
  addFields(fields: Array<{ label: string; value: string; isShort?: boolean }>): this {
    this.flushActions();
    this.elements.push({
      tag: 'div',
      fields: fields.map((f) => ({
        is_short: f.isShort ?? true,
        text: {
          tag: 'lark_md',
          content: `**${f.label}**\n${f.value}`,
        },
      })),
    });
    return this;
  }

  /**
   * Appends a horizontal divider line.
   */
  addDivider(): this {
    this.flushActions();
    this.elements.push({
      tag: 'hr',
    });
    return this;
  }

  /**
   * Appends an interactive button to the current action row.
   */
  addButton(
    text: string,
    options?: {
      type?: CardButtonType | undefined;
      url?: string | undefined;
      value?: Record<string, unknown> | undefined;
    },
  ): this {
    const actionItem: CardActionItem = {
      tag: 'button',
      text: {
        tag: 'plain_text',
        content: text,
      },
    };

    if (options?.type !== undefined) {
      actionItem.type = options.type;
    }
    if (options?.url !== undefined) {
      actionItem.url = options.url;
    }
    if (options?.value !== undefined) {
      actionItem.value = options.value;
    }

    this.currentActionGroup.push(actionItem);
    return this;
  }

  /**
   * Appends any custom Feishu card element directly.
   */
  addRawElement(element: CardElement): this {
    this.flushActions();
    this.elements.push(element);
    return this;
  }

  /**
   * Sets whether the card expands in wide screen mode.
   */
  setWideScreen(enable: boolean): this {
    this.wideScreenMode = enable;
    return this;
  }

  private flushActions(): void {
    if (this.currentActionGroup.length > 0) {
      this.elements.push({
        tag: 'action',
        actions: [...this.currentActionGroup],
      });
      this.currentActionGroup = [];
    }
  }

  /**
   * Assembles the card payload object conforming to Feishu schema.
   */
  build(): FeishuCardPayload {
    this.flushActions();
    const payload: FeishuCardPayload = {
      config: {
        wide_screen_mode: this.wideScreenMode,
      },
      elements: [...this.elements],
    };

    if (this.header !== undefined) {
      payload.header = this.header;
    }

    return payload;
  }

  /**
   * Builds and serializes the card into a JSON string ready for sendCard.
   */
  buildJSON(): string {
    return JSON.stringify(this.build());
  }
}
