import { 
  GmailCreateDraft, 
  GmailGetMessage, 
  GmailGetThread, 
  GmailSearch, 
  GmailSendMessage 
} from '@langchain/community/tools/gmail';

const dummyAuth = {
    getAccessToken: async () => ({ token: 'mock' })
};

// Mock params to adapt to the structure we use
const params = {
    credentials: {
        accessToken: async () => 'mock-token'
    }
};

const tools = [
  new GmailCreateDraft(params),
  new GmailGetMessage(params),
  new GmailGetThread(params),
  new GmailSearch(params),
  new GmailSendMessage(params),
];

console.log('--- Tool Names ---');
tools.forEach(t => {
    console.log(`Class: ${t.constructor.name} -> Name: "${t.name}"Description: ${t.description}`);
});
