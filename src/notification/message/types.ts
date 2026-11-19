export type CardColorTheme =
    | 'blue'
    | 'wathet'
    | 'turquoise'
    | 'green'
    | 'yellow'
    | 'orange'
    | 'red'
    | 'carmine'
    | 'violet'
    | 'purple'
    | 'indigo'
    | 'grey'
    | 'default';

export type CardButtonType = 'default' | 'primary' | 'danger';

export interface CardMarkdownElement {
    tag: 'div';
    text: {
        tag: 'lark_md';
        content: string;
    };
}

export interface CardFieldsElement {
    tag: 'div';
    fields: Array<{
        is_short: boolean;
        text: {
            tag: 'lark_md';
            content: string;
        };
    }>;
}

export interface CardDividerElement {
    tag: 'hr';
}

export interface CardActionGroupElement {
    tag: 'action';
    actions: CardActionItem[];
}

export type CardElement =
    CardMarkdownElement | CardFieldsElement | CardDividerElement | CardActionGroupElement;

export interface CardCustomElement {
    tag: string;
    [key: string]: unknown;
}

export interface CardHeader {
    title: {
        tag: 'plain_text';
        content: string;
    };
    template?: CardColorTheme;
}

export interface CardActionItem {
    tag: 'button';
    text: {
        tag: 'plain_text';
        content: string;
    };
    type?: CardButtonType;
    url?: string;
    multi_url?: {
        url?: string;
        android_url?: string;
        ios_url?: string;
        pc_url?: string;
    };
    value?: Record<string, unknown>;
}

export interface FeishuCardPayload {
    config?: {
        wide_screen_mode?: boolean;
        [key: string]: unknown;
    };
    header?: CardHeader;
    elements: Array<CardElement | CardCustomElement>;
}
