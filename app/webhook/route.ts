import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { verifyWebhook } from '@/lib/verify';
import { WebHookRequest,TwilioWebHookBody } from '../../types/webhook';
import { createServiceClient } from '@/lib/supabase/service-client';
import { DBTables } from '@/lib/enums/Tables';
import { downloadMedia } from './media';
import { updateBroadCastReplyStatus, updateBroadCastStatus } from './bulk-send-events';

export const revalidate = 0

export async function GET(request: Request) {
  const urlDecoded = new URL(request.url)
  const urlParams = urlDecoded.searchParams
  let mode = urlParams.get('hub.mode');
  let token = urlParams.get('hub.verify_token');
  let challenge = urlParams.get('hub.challenge');
  if (mode && token && challenge && mode == 'subscribe') {
    const isValid = token == process.env.WEBHOOK_VERIFY_TOKEN
    if (isValid) {
      return new NextResponse(challenge)
    } else {
      return new NextResponse(null, { status: 403 })
    }
  } else {
    return new NextResponse(null, { status: 400 })
  }
}

export async function POST(request: NextRequest) {
  const headersList = headers();
  //const xHubSigrature256 = headersList.get('x-hub-signature-256');
  console.log('Original Request',request.body);
  const rawRequestBody = await request.text();
  console.log('Request',rawRequestBody);
  // if (!xHubSigrature256 || !verifyWebhook(rawRequestBody, xHubSigrature256)) {
  //   console.warn(`Invalid signature : ${xHubSigrature256}`)
  //   return new NextResponse(null, { status: 401 })
  // }
  const webhookBody = JSON.parse(rawRequestBody) as TwilioWebHookBody;
    const supabase = createServiceClient()
    let { error } = await supabase
      .from(DBTables.Webhook)
      .insert(webhookBody)
    if (error) throw error
    const messageProps = webhookBody
    if (!webhookBody) {
      if (messageProps.SmsMessage.MessageType === "text") {
            let error = await supabase
              .from(DBTables.Contacts)
              .upsert({
                wa_id: messageProps.SmsMessage.WaId,
                profile_name: messageProps.SmsMessage.ProfileName,
                last_message_at: new Date(),
                last_message_received_at: new Date(),
                in_chat: true,
              })
            if (error) throw error

           error  = await supabase
            .from(DBTables.Messages)
            .upsert(
               {
                chat_id: messageProps.SmsMessage.WaId,
                message: messageProps.SmsMessage.Body,
                wam_id: messageProps.SmsMessage.MessageSid,
                created_at: new Date(),
                is_received: true,
              }, { onConflict: 'wam_id', ignoreDuplicates: true })

          if (error) throw new Error("Error while inserting messages to database", { cause: error})
          // for (const message of messages) {
          //   if (message.type === 'image' || message.type === 'video' || message.type === 'document') {
          //     await downloadMedia(message)
          //   }
          // }
          //await updateBroadCastReplyStatus(messages)
          await supabase.functions.invoke('update-unread-count', { body: {
            chat_id: messageProps.SmsMessage.WaId
          }})
            const update_obj: {
              wam_id_in: string,
              sent_at_in?: Date,
              delivered_at_in?: Date,
              read_at_in?: Date,
              failed_at_in?: Date,
            } = {
              wam_id_in: messageProps.SmsMessage.MessageSid,
            }
            let functionName: 'update_message_delivered_status' | 'update_message_read_status' | 'update_message_sent_status' | 'update_message_failed_status' | null = null;
            if (messageProps.SmsMessage.SmsStatus === 'sent') {
              update_obj.sent_at_in = new Date()
              functionName = 'update_message_sent_status'
            } else if (messageProps.SmsMessage.SmsStatus === 'delivered') {
              update_obj.delivered_at_in = new Date()
              functionName = 'update_message_delivered_status'
            } else if (messageProps.SmsMessage.SmsStatus === 'read') {
              update_obj.read_at_in = new Date()
              functionName = 'update_message_read_status'
            } else if (messageProps.SmsMessage.SmsStatus === 'failed') {
              update_obj.failed_at_in = new Date()
              functionName = 'update_message_failed_status'
            } else {
              console.warn(`Unknown status : ${messageProps.SmsMessage.SmsStatus}`)
              console.warn('status', status)
              return new NextResponse()
            }
            if (functionName) {
              const { data, error: updateDeliveredStatusError } = await supabase.rpc(functionName, update_obj)
              if (updateDeliveredStatusError) throw new Error(`Error while updating status, functionName: ${functionName} wam_id: ${messageProps.SmsMessage.MessageSid} status: ${messageProps.SmsMessage.SmsStatus}`, { cause: updateDeliveredStatusError })
              //console.log(`${functionName} data`, data)
              // if (data) {
              //   await updateBroadCastStatus(messageProps.SmsStatus)
              // } else {
              //   console.warn(`Status already updated : ${status.id} : ${status.status}`)
              // }
            }
          
      }
    }
  
  return new NextResponse()
}
