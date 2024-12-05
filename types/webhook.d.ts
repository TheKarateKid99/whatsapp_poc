export type WebhookImage = {
    id: string,
    sha256: string,
    mime_type: string,
}

export type WebhookMessage = {
    from: string,
    id: string,
    timestamp: string,
    image?: WebhookImage,
    video?: WebhookImage,
    document?: WebhookImage,
    type: 'text' | 'reaction' | 'image' | 'video' | 'document',
}

export type WebhookStatus = {
    id: string,
    status: 'read' | 'sent' | 'delivered' | 'failed',
    timestamp: string,
    recipient_id: string,
    pricing?: {
        billable: boolean,
        category: string,
        pricing_model: string,
    },
    conversation?: {
        id: string,
        origin: {
            type: string,
        },
        expiration_timestamp?: string,
    },
}

export type WebHookRequest = {
    object: "whatsapp_business_account",
    entry: [
        {
            id: string,
            changes: [
                {
                    value: {
                        metadata: {
                            display_phone_number: string,
                            phone_number_id: string,
                        }
                        contacts: Contact[],
                        messages: WebhookMessage[],
                        statuses: WebhookStatus[],
                    },
                    field: string
                }
            ]
        }
    ]
}
export type TwilioWebHookBody = {
    
    object: "whatsapp_business_account",

        SmsMessageSid: string;
        NumMedia: string;
        ProfileName: string;
        MessageType: string;
        SmsSid: string;
        WaId: string;
        SmsStatus: string;
        Body: string;
        To: string;
        MessagingServiceSid: string;
        NumSegments: string;
        ReferralNumMedia: string;
        MessageSid: string;
        AccountSid: string;
        From: string;
        ApiVersion: string;

}
