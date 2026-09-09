(function () {
"use strict";

/* ============================================================
TEKTON ASSIST — INDEX PAGE
Elevator-door opening AI assistant
============================================================ */

const CONFIG = {
/*
Replace this with your Google Apps Script /exec URL.
*/
API_URL: "https://script.google.com/macros/s/AKfycbzF4CJzgEB4NC_k27fr9hhJ6SAbagJa39lVTswS9WiDDb28KNbM9TgyO_gf1YAnIok5/exec",

```
company: "Tekton Elevators",
assistantName: "Tekton Assist",
phone: "+91 89254 48131",

logo: "./assets/logo-full.png",

systemPrompt:
  'You are "Tekton Assist", the official AI customer-support assistant for Tekton Elevators.',
  'You are speaking directly with a website visitor.',
  'Behave like a polite, natural human customer-service agent — not like a brochure, advertisement, or technical manual.',

  '',

  'PRIMARY CONVERSATION RULE:',
  'Answer only what the customer is asking right now.',
  'Do not provide company information, product lists, standards, specifications, or sales information unless it is relevant to the customer question.',
  'Do not repeat the same information in multiple ways.',
  'Do not give a long introduction before answering a simple question.',

  '',

  'GENERAL / CASUAL CONVERSATION:',
  'If the customer says Hi, Hello, Good morning, How are you, Thank you, or another simple social message, reply briefly and naturally.',
  'Examples:',
  'Customer: Hi',
  'Reply: Hello! How can I help you today?',
  'Customer: How are you?',
  'Reply: I am doing well, thank you. How can I help with your lift requirement?',
  'Customer: Thank you',
  'Reply: You are welcome. Please let me know how I can help.',
  'Do not mention IS 14665, products, company history, technical specifications, or the Tekton slogan unless the customer asks for something related to them.',

  '',

  'WHEN THE CUSTOMER STARTS ASKING ABOUT LIFTS:',
  'Once the customer asks about a lift, elevator, home lift, passenger lift, MRL, goods lift, shaft, cabin, doors, capacity, floors, quotation, installation, maintenance, safety, or related subject, continue the conversation naturally around that requirement.',
  'Do not restart with a generic welcome message.',
  'Answer the actual question first, then ask at most one useful follow-up question when needed.',

  '',

  'ANSWER LENGTH:',
  'Keep normal replies short.',
  'For a simple question, normally use 1 to 3 short sentences.',
  'For a technical question, normally use 2 to 5 short sentences.',
  'Use bullets only when they make the answer easier to understand.',
  'Do not write long paragraphs unless the customer specifically requests detailed information.',
  'Never add unnecessary closing statements.',

  '',

  'CUSTOMER MOOD:',
  'Match the customer tone naturally.',
  'If the customer is casual, be friendly and brief.',
  'If the customer is professional, be professional.',
  'If the customer is confused, explain simply.',
  'If the customer is worried, be calm and reassuring.',
  'If the customer is frustrated, apologise briefly and focus on solving the problem.',
  'Never use slang, exaggerated marketing language, or unnecessary emojis.',

  '',

  'LANGUAGE:',
  'Reply in the same language used by the customer.',
  'If the customer writes in Tamil, reply naturally in Tamil.',
  'If the customer writes in English, reply in English.',
  'Do not switch languages unless the customer does.',

  '',

  'TECHNICAL INFORMATION:',
  'For lift-related technical questions, use the company information provided below and applicable official Indian Standards.',
  'Use IS 14665 for electric traction lift related guidance where applicable.',
  'IS 14665 Part 1 relates to outline dimensions.',
  'IS 14665 Part 2 relates to installation, operation and maintenance.',
  'IS 14665 Part 3 relates to safety rules.',
  'For MRL applications, refer to the applicable Indian Standard and explain that final dimensions depend on the specific lift design and site conditions.',
  'For home lifts, use the applicable Indian Standard for home lifts where relevant.',
  'Do not present a general dimension as a guaranteed dimension for every project.',

  '',

  'STANDARDS ACCURACY:',
  'Never invent an IS code, clause number, table number, dimension, safety requirement, certification, or compliance claim.',
  'Do not claim that one fixed pit depth, overhead, shaft size, door size, or cabin size applies to every lift.',
  'When dimensions depend on lift speed, capacity, configuration, machine arrangement, door arrangement, or site conditions, clearly say so.',
  'When the customer needs a project-specific dimension, recommend an engineering site survey by Tekton Elevators.',

  '',

  'PRICE / QUOTATION:',
  'Never invent a price, discount, delivery date, installation date, or completion date.',
  'Explain briefly that the quotation depends on the lift type, capacity, number of stops, shaft dimensions, finishes, travel and site conditions.',
  'When appropriate, ask for the missing information needed for an official quotation.',
  'Do not ask for all customer details at once unless necessary.',

  '',

  'LEAD CAPTURE:',
  'Gradually collect the following when relevant:',
  '1. Customer name',
  '2. Mobile number',
  '3. Location',
  '4. Number of floors / stops',
  '5. Shaft width × depth',
  'Do not ask again for information the customer has already provided.',
  'Ask naturally, one relevant question at a time.',
  'If the customer only asks a general question, answer the question first and do not immediately turn the conversation into a sales form.',

  '',

  'TECHNICAL DRAWING / DESIGN:',
  'If the customer asks for a technical layout or shaft planning guidance, provide general guidance first.',
  'Then ask for shaft width, shaft depth, number of stops, and location only when necessary.',
  'Recommend the Tekton Lift Designer on the website when appropriate.',
  'Make it clear that the final engineering design requires site verification.',

  '',

  'SAFETY:',
  'Never provide instructions for bypassing safety devices, forcing lift doors, repairing lift machinery, overriding controls, or carrying out dangerous maintenance.',
  'If a person is trapped in a lift or there is an emergency, immediately tell the customer to call Tekton service at +91 89254 48131 and not to force the lift doors open.',

  '',

  'SCOPE:',
  'You may assist with elevators, home lifts, passenger lifts, goods lifts, MRL lifts, cabin design, shaft planning, doors, capacity, floors, safety, maintenance, modernization, quotations, and Tekton Elevators.',
  'For unrelated topics, politely say that you assist with Tekton Elevators and lift-related enquiries.',

  '',

  'COMPANY INFORMATION:',
  'Company: Tekton Elevators.',
  'Services: design, manufacturing, installation and maintenance of traction, MRL, goods and home lifts.',
  'Phone: +91 89254 48131 / +91 95001 58530.',
  'Email: info@tektonelevators.com.',
  'Website: www.tektonelevators.com.',
  'Use only company information provided in the configuration.',
  'Do not invent additional company facts.',

  '',

  'FINAL RESPONSE RULE:',
  'Always answer the customer message directly.',
  'Do not automatically add a greeting, company introduction, product list, standard list, slogan, or contact information unless it is relevant.',
  'The customer should feel like they are chatting with a helpful Tekton service agent.',
  'Keep the response focused, natural, polite and useful.'"
```

};

/* ============================================================
CREATE STYLES
============================================================ */

const style = document.createElement("style");

style.textContent = `

```
/* ==========================================================
   OVERLAY
   ========================================================== */

#tekton-assist-overlay {
  position: fixed;
  inset: 0;
  z-index: 99990;
  background: rgba(5, 17, 33, .72);
  backdrop-filter: blur(4px);
  display: none;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity .35s ease;
}

#tekton-assist-overlay.ta-active {
  display: flex;
  opacity: 1;
}


/* ==========================================================
   ELEVATOR CABIN
   ========================================================== */

.ta-elevator {
  position: relative;

  width: min(430px, calc(100vw - 30px));
  height: min(700px, calc(100vh - 30px));

  background:
    linear-gradient(
      145deg,
      #e9edf2,
      #cfd5dc
    );

  border:
    5px solid #8c949e;

  border-radius: 14px;

  box-shadow:
    0 35px 90px rgba(0,0,0,.45);

  overflow: hidden;

  transform:
    translateY(25px)
    scale(.96);

  transition:
    transform .55s cubic-bezier(.2,.8,.2,1);
}

#tekton-assist-overlay.ta-active .ta-elevator {
  transform:
    translateY(0)
    scale(1);
}


/* ==========================================================
   ELEVATOR TOP PANEL
   ========================================================== */

.ta-top-panel {
  position: absolute;

  left: 0;
  top: 0;

  width: 100%;
  height: 48px;

  background:
    linear-gradient(
      180deg,
      #151b22,
      #080d13
    );

  z-index: 20;

  display: flex;
  align-items: center;
  justify-content: center;
}

.ta-top-brand {
  color: white;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 2px;
  opacity: .8;
}


/* ==========================================================
   CABIN INTERIOR
   ========================================================== */

.ta-cabin {
  position: absolute;

  left: 18px;
  right: 18px;

  top: 62px;
  bottom: 18px;

  border:
    2px solid #8c939b;

  background:
    linear-gradient(
      90deg,
      #aeb5bc,
      #edf0f3 48%,
      #b2b9c0
    );

  overflow: hidden;
}

.ta-cabin-ceiling {
  position: absolute;

  top: 0;
  left: 0;

  width: 100%;
  height: 45px;

  background:
    linear-gradient(
      180deg,
      #f5f6f7,
      #c7ccd1
    );

  border-bottom:
    1px solid #9ba2a9;
}


/* ==========================================================
   CABIN BACK WALL
   ========================================================== */

.ta-back-wall {
  position: absolute;

  top: 45px;
  left: 0;

  width: 100%;
  bottom: 0;

  background:
    linear-gradient(
      90deg,
      #b7bec5,
      #f4f5f6 50%,
      #b8bec5
    );
}


/* ==========================================================
   TEKTON LOGO INSIDE CABIN
   ========================================================== */

.ta-cabin-logo {
  position: absolute;

  top: 78px;
  left: 50%;

  transform:
    translateX(-50%);

  width: 125px;
  height: 55px;

  object-fit: contain;

  filter:
    drop-shadow(
      0 4px 8px rgba(0,0,0,.18)
    );

  z-index: 4;

  opacity: .96;
}


/* ==========================================================
   FLOOR
   ========================================================== */

.ta-floor {
  position: absolute;

  left: 0;
  right: 0;
  bottom: 0;

  height: 92px;

  background:
    repeating-linear-gradient(
      90deg,
      #7f858a 0px,
      #858b90 40px,
      #72787d 41px,
      #858b90 80px
    );

  border-top:
    2px solid #666d73;
}


/* ==========================================================
   DOORS
   ========================================================== */

.ta-door-frame {
  position: absolute;

  left: 50%;

  bottom: 0;

  width: 245px;
  height: 455px;

  transform:
    translateX(-50%);

  background:
    #596067;

  border:
    4px solid #41474d;

  overflow: hidden;

  z-index: 5;
}


.ta-door-left,
.ta-door-right {

  position: absolute;

  top: 0;
  bottom: 0;

  width: 50%;

  background:
    linear-gradient(
      90deg,
      #dce0e3,
      #9da4aa,
      #d5d9dc
    );

  box-shadow:
    inset 0 0 14px rgba(0,0,0,.2);

  transition:
    transform .9s cubic-bezier(.65,0,.35,1);
}


.ta-door-left {
  left: 0;
  transform: translateX(0);
  border-right: 1px solid #7d848a;
}


.ta-door-right {
  right: 0;
  transform: translateX(0);
  border-left: 1px solid #7d848a;
}


/* Doors OPEN */

#tekton-assist-overlay.ta-open .ta-door-left {
  transform:
    translateX(-100%);
}

#tekton-assist-overlay.ta-open .ta-door-right {
  transform:
    translateX(100%);
}


/* ==========================================================
   CHAT PANEL
   ========================================================== */

.ta-chat {

  position: absolute;

  left: 12px;
  right: 12px;

  top: 84px;
  bottom: 14px;

  z-index: 10;

  display: flex;
  flex-direction: column;

  background:
    rgba(255,255,255,.97);

  border:
    1px solid #dce2e8;

  border-radius: 16px;

  overflow: hidden;

  box-shadow:
    0 15px 40px rgba(20,30,40,.28);

  opacity: 0;

  transform:
    translateY(18px);

  transition:
    opacity .5s ease .75s,
    transform .5s ease .75s;
}


#tekton-assist-overlay.ta-open .ta-chat {

  opacity: 1;

  transform:
    translateY(0);
}


/* ==========================================================
   CHAT HEADER
   ========================================================== */

.ta-chat-header {

  height: 62px;

  flex-shrink: 0;

  padding:
    10px 12px;

  box-sizing: border-box;

  background:
    linear-gradient(
      135deg,
      #0b2346,
      #07182f
    );

  color: white;

  display: flex;

  align-items: center;

  justify-content: space-between;
}


.ta-chat-brand {

  display: flex;

  align-items: center;

  gap: 9px;
}


.ta-chat-logo {

  width: 37px;
  height: 37px;

  padding: 5px;

  box-sizing: border-box;

  object-fit: contain;

  border-radius: 9px;

  background: white;
}


.ta-chat-title {

  font-size: 13px;

  font-weight: 800;
}


.ta-chat-subtitle {

  margin-top: 2px;

  font-size: 9.5px;

  opacity: .72;
}


.ta-status {

  display: flex;

  align-items: center;

  gap: 5px;

  font-size: 9px;

  margin-top: 2px;

  opacity: .8;
}


.ta-status-dot {

  width: 6px;
  height: 6px;

  border-radius: 50%;

  background: #63d28d;
}


.ta-chat-close {

  width: 30px;
  height: 30px;

  border: none;

  border-radius: 8px;

  background:
    rgba(255,255,255,.1);

  color: white;

  font-size: 19px;

  cursor: pointer;
}


/* ==========================================================
   MESSAGES
   ========================================================== */

.ta-messages {

  flex: 1;

  overflow-y: auto;

  padding: 14px;

  background:
    #f6f8fb;
}


.ta-message {

  display: flex;

  margin-bottom: 10px;
}


.ta-message.user {

  justify-content: flex-end;
}


.ta-bubble {

  max-width: 83%;

  padding:
    9px 11px;

  border-radius: 12px;

  font-size: 12px;

  line-height: 1.5;

  white-space: pre-wrap;
}


.ta-message.assistant .ta-bubble {

  background: white;

  color: #172b46;

  border:
    1px solid #dfe5ec;

  border-bottom-left-radius: 4px;
}


.ta-message.user .ta-bubble {

  background: #0b2346;

  color: white;

  border-bottom-right-radius: 4px;
}


/* ==========================================================
   QUICK BUTTONS
   ========================================================== */

.ta-quick {

  padding:
    0 11px 8px;

  background:
    #f6f8fb;

  display: flex;

  flex-wrap: wrap;

  gap: 5px;
}


.ta-quick button {

  border:
    1px solid #d6dee7;

  background: white;

  color: #243b57;

  border-radius: 999px;

  padding:
    6px 9px;

  font-size: 9.5px;

  cursor: pointer;
}


.ta-quick button:hover {

  border-color: #b27a28;

  color: #9a631b;
}


/* ==========================================================
   INPUT
   ========================================================== */

.ta-input {

  display: flex;

  gap: 6px;

  padding: 9px;

  border-top:
    1px solid #dfe5ec;

  background: white;
}


.ta-input textarea {

  flex: 1;

  min-width: 0;

  height: 39px;

  resize: none;

  box-sizing: border-box;

  border:
    1px solid #d4dce6;

  border-radius: 10px;

  padding:
    9px 10px;

  outline: none;

  font:
    inherit;

  font-size: 12px;
}


.ta-input textarea:focus {

  border-color:
    #0b2346;
}


.ta-send {

  width: 39px;
  height: 39px;

  flex: 0 0 39px;

  border: none;

  border-radius: 10px;

  background: #0b2346;

  color: white;

  cursor: pointer;
}


.ta-send:disabled {

  opacity: .45;

  cursor:
    not-allowed;
}


/* ==========================================================
   CUSTOMER INFORMATION
   ========================================================== */

.ta-info {

  display: none;

  padding:
    8px 11px;

  background:
    #fffdf8;

  border-top:
    1px solid #eee1c9;

  font-size: 9px;

  color: #77551e;
}


.ta-info.visible {

  display: block;
}


/* ==========================================================
   MOBILE
   ========================================================== */

@media(max-width:600px) {

  #tekton-assist-overlay {

    align-items:
      flex-end;
  }


  .ta-elevator {

    width:
      calc(100vw - 12px);

    height:
      calc(100vh - 12px);

    border-radius:
      12px 12px 0 0;
  }


  .ta-chat {

    top: 72px;
  }


  .ta-cabin-logo {

    top: 65px;
  }
}
```

`;

document.head.appendChild(style);

/* ============================================================
HTML
============================================================ */

const root = document.createElement("div");

root.innerHTML = `

```
<div id="tekton-assist-overlay">

  <div class="ta-elevator">

    <div class="ta-top-panel">

      <div class="ta-top-brand">
        TEKTON ELEVATORS
      </div>

    </div>


    <div class="ta-cabin">

      <div class="ta-cabin-ceiling"></div>

      <div class="ta-back-wall"></div>


      <img
        class="ta-cabin-logo"
        src="${CONFIG.logo}"
        alt="Tekton Elevators">


      <div class="ta-floor"></div>


      <div class="ta-door-frame">

        <div class="ta-door-left"></div>

        <div class="ta-door-right"></div>

      </div>


      <!-- ==================================================
           CHAT
           ================================================== -->

      <div class="ta-chat">

        <div class="ta-chat-header">

          <div class="ta-chat-brand">

            <img
              class="ta-chat-logo"
              src="${CONFIG.logo}"
              alt="Tekton">


            <div>

              <div class="ta-chat-title">
                Tekton Assist
              </div>

              <div class="ta-chat-subtitle">
                AI Elevator Advisor
              </div>

              <div class="ta-status">

                <span class="ta-status-dot"></span>

                Online

              </div>

            </div>

          </div>


          <button
            class="ta-chat-close"
            id="ta-close">
            ×
          </button>

        </div>


        <div
          class="ta-messages"
          id="ta-messages">
        </div>


        <div
          class="ta-info"
          id="ta-info">
        </div>


        <div
          class="ta-quick"
          id="ta-quick">
        </div>


        <div class="ta-input">

          <textarea
            id="ta-input"
            placeholder="Type your question..."
            rows="1"></textarea>


          <button
            class="ta-send"
            id="ta-send"
            aria-label="Send">

            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round">

              <path d="M22 2 11 13"></path>

              <path d="m22 2-7 20-4-9-9-4Z"></path>

            </svg>

          </button>

        </div>

      </div>

    </div>

  </div>

</div>
```

`;

document.body.appendChild(root);

/* ============================================================
ELEMENTS
============================================================ */

const overlay =
document.getElementById(
"tekton-assist-overlay"
);

const closeButton =
document.getElementById(
"ta-close"
);

const messages =
document.getElementById(
"ta-messages"
);

const quick =
document.getElementById(
"ta-quick"
);

const input =
document.getElementById(
"ta-input"
);

const send =
document.getElementById(
"ta-send"
);

/* ============================================================
STATE
============================================================ */

let history = [];

let busy = false;

let opened = false;

let customerData = {

```
name: "",

mobile: "",

location: "",

floors: "",

shaftSize: ""
```

};

/* ============================================================
FIND EXISTING AI BUTTON
============================================================ */

/*
If your website already has an AI button, this script will
automatically attach the elevator-opening experience to it.

```
Add one of these IDs to your existing AI button if needed:

  id="tekton-ai-button"

or

  id="ai-assistant-button"
```

*/

const existingButton =
document.getElementById(
"tekton-ai-button"
) ||
document.getElementById(
"ai-assistant-button"
);

/*
If there is no existing button, create one.
*/

if (!existingButton) {

```
const floating =
  document.createElement(
    "button"
  );

floating.id =
  "tekton-ai-button";

floating.setAttribute(
  "aria-label",
  "Open Tekton Assist"
);

floating.innerHTML = `

  <img
    src="${CONFIG.logo}"
    alt="Tekton"
    style="
      width:36px;
      height:36px;
      object-fit:contain;
    ">

  <span style="
    position:absolute;
    top:-2px;
    right:-2px;
    background:#b27a28;
    color:white;
    border:2px solid white;
    border-radius:20px;
    padding:3px 6px;
    font-size:8px;
    font-weight:800;
  ">
    AI
  </span>

`;

floating.style.cssText = `

  position:fixed;
  right:25px;
  bottom:25px;
  width:62px;
  height:62px;
  border:0;
  border-radius:50%;
  background:#0b2346;
  display:flex;
  align-items:center;
  justify-content:center;
  cursor:pointer;
  box-shadow:0 12px 35px rgba(7,26,52,.3);
  z-index:99989;

`;

document.body.appendChild(
  floating
);

floating.addEventListener(
  "click",
  openAssistant
);
```

} else {

```
existingButton.addEventListener(
  "click",
  function (event) {

    /*
      Prevent an existing chatbot from opening
      at the same time.
    */

    event.preventDefault();
    event.stopPropagation();

    openAssistant();

  },
  true
);
```

}

/* ============================================================
OPEN ASSISTANT
============================================================ */

function openAssistant() {

```
overlay.style.display =
  "flex";

requestAnimationFrame(
  function () {

    overlay.classList.add(
      "ta-active"
    );

  }
);


setTimeout(
  function () {

    overlay.classList.add(
      "ta-open"
    );

  },
  180
);


if (!opened) {

  opened = true;

  setTimeout(
    function () {

      addMessage(
        "assistant",
        "Hi 👋 How can I help you today?"
      );

      renderQuickActions();

    },
    950
  );

}
```

}

/* ============================================================
CLOSE ASSISTANT
============================================================ */

function closeAssistant() {

```
overlay.classList.remove(
  "ta-open"
);

setTimeout(
  function () {

    overlay.classList.remove(
      "ta-active"
    );

    overlay.style.display =
      "none";

  },
  450
);
```

}

closeButton.addEventListener(
"click",
closeAssistant
);

overlay.addEventListener(
"click",
function (event) {

```
  if (
    event.target === overlay
  ) {

    closeAssistant();

  }

}
```

);

/* ============================================================
MESSAGE
============================================================ */

function addMessage(
role,
text
) {

```
const row =
  document.createElement(
    "div"
  );

row.className =
  "ta-message " +
  role;


const bubble =
  document.createElement(
    "div"
  );

bubble.className =
  "ta-bubble";

bubble.textContent =
  text;


row.appendChild(
  bubble
);

messages.appendChild(
  row
);


messages.scrollTop =
  messages.scrollHeight;
```

}

/* ============================================================
TYPING
============================================================ */

function showTyping() {

```
const row =
  document.createElement(
    "div"
  );

row.id =
  "ta-typing";

row.className =
  "ta-message assistant";


const bubble =
  document.createElement(
    "div"
  );

bubble.className =
  "ta-bubble";

bubble.textContent =
  "Tekton Assist is typing…";


row.appendChild(
  bubble
);

messages.appendChild(
  row
);


messages.scrollTop =
  messages.scrollHeight;
```

}

function hideTyping() {

```
const typing =
  document.getElementById(
    "ta-typing"
  );

if (typing) {

  typing.remove();

}
```

}

/* ============================================================
QUICK ACTIONS
============================================================ */

function renderQuickActions() {

```
quick.innerHTML = "";


const actions = [

  "I need a lift",

  "Home lift",

  "Shaft size",

  "Get quotation"

];


actions.forEach(
  function (text) {

    const button =
      document.createElement(
        "button"
      );

    button.textContent =
      text;


    button.addEventListener(
      "click",
      function () {

        input.value =
          text;

        sendMessage();

      }
    );


    quick.appendChild(
      button
    );

  }
);
```

}

/* ============================================================
SEND MESSAGE
============================================================ */

async function sendMessage() {

```
const text =
  input.value.trim();


if (
  !text ||
  busy
) {

  return;

}


addMessage(
  "user",
  text
);


history.push({

  role: "user",

  text: text

});


input.value = "";

busy = true;

send.disabled = true;

showTyping();


try {

  if (
    !CONFIG.API_URL ||
    CONFIG.API_URL.includes(
      "PASTE_YOUR"
    )
  ) {

    throw new Error(
      "API URL not configured"
    );

  }


  const response =
    await fetch(
      CONFIG.API_URL,
      {

        method: "POST",

        headers: {

          "Content-Type":
            "text/plain;charset=utf-8"

        },

        body:
          JSON.stringify({

            action: "chat",

            message: text,

            history:
              history.slice(-12),

            customerData:
              customerData,

            systemPrompt:
              CONFIG.systemPrompt,

            page: "index",

            pageUrl:
              window.location.href

          })

      }
    );


  if (!response.ok) {

    throw new Error(
      "AI request failed"
    );

  }


  const data =
    await response.json();


  hideTyping();


  if (
    !data ||
    !data.reply
  ) {

    throw new Error(
      "No AI reply"
    );

  }


  addMessage(
    "assistant",
    data.reply
  );


  history.push({

    role: "assistant",

    text: data.reply

  });


  /*
    If the backend returns extracted
    customer information, update it.
  */

  if (
    data.customerData
  ) {

    customerData =
      Object.assign(
        customerData,
        data.customerData
      );

    updateCustomerInfo();

  }


  /*
    Also try simple extraction from
    the customer's own message.
  */

  extractCustomerData(text);


  /*
    If all required information is available,
    save it automatically.
  */

  if (
    isComplete()
  ) {

    await saveLead();

  }


} catch (error) {

  hideTyping();


  /*
    During development, show a useful
    message rather than failing silently.
  */

  addMessage(
    "assistant",
    "I'm sorry, I couldn't connect to the assistant right now. " +
    "Please call Tekton Elevators at " +
    CONFIG.phone +
    " and our team will be happy to help."
  );

} finally {

  busy = false;

  send.disabled = false;

  input.focus();

}
```

}

/* ============================================================
BASIC CUSTOMER DATA EXTRACTION
============================================================ */

function extractCustomerData(text) {

```
/*
  Floors
*/

const floorMatch =
  text.match(
    /(?:^|\s)(\d+)\s*(?:floor|floors|storey|storeys)\b/i
  );

if (
  floorMatch &&
  !customerData.floors
) {

  customerData.floors =
    floorMatch[1];

}


/*
  Mobile number
*/

const mobileMatch =
  text.match(
    /(?:\+91[\s-]?)?[6-9]\d{9}/
  );

if (
  mobileMatch &&
  !customerData.mobile
) {

  customerData.mobile =
    mobileMatch[0];

}


/*
  Shaft size
  Examples:
  1500 x 1500
  1500x1800 mm
  5 x 5 feet
*/

const shaftMatch =
  text.match(
    /(\d{3,5})\s*[x×]\s*(\d{3,5})\s*(mm|millimeter|millimetre)?/i
  );

if (
  shaftMatch &&
  !customerData.shaftSize
) {

  customerData.shaftSize =
    shaftMatch[1] +
    " x " +
    shaftMatch[2] +
    (
      shaftMatch[3]
        ? " " + shaftMatch[3]
        : ""
    );

}


updateCustomerInfo();
```

}

/* ============================================================
SHOW CUSTOMER INFORMATION STATUS
============================================================ */

function updateCustomerInfo() {

```
const info =
  document.getElementById(
    "ta-info"
  );


const completed = [];


if (customerData.name)
  completed.push("Name");

if (customerData.mobile)
  completed.push("Mobile");

if (customerData.location)
  completed.push("Location");

if (customerData.floors)
  completed.push("Floors");

if (customerData.shaftSize)
  completed.push("Shaft size");


if (completed.length) {

  info.classList.add(
    "visible"
  );

  info.textContent =
    "Information collected: " +
    completed.join(" • ");

}
```

}

/* ============================================================
CHECK COMPLETION
============================================================ */

function isComplete() {

```
return Boolean(

  customerData.name &&
  customerData.mobile &&
  customerData.location &&
  customerData.floors &&
  customerData.shaftSize

);
```

}

/* ============================================================
SAVE LEAD TO GOOGLE SHEET
============================================================ */

let leadSaved = false;

async function saveLead() {

```
if (
  leadSaved
) {

  return;

}


leadSaved = true;


try {

  await fetch(
    CONFIG.API_URL,
    {

      method: "POST",

      headers: {

        "Content-Type":
          "text/plain;charset=utf-8"

      },

      body:
        JSON.stringify({

          action: "lead",

          source:
            "Index AI Assistant",

          clientName:
            customerData.name,

          clientPhone:
            customerData.mobile,

          siteLocation:
            customerData.location,

          floors:
            customerData.floors,

          shaftSize:
            customerData.shaftSize,

          conversation:
            history.slice(-20),

          page:
            "index",

          pageUrl:
            window.location.href

        })

    }
  );


  addMessage(
    "assistant",
    "Thank you. I have noted your requirement. " +
    "Our Tekton team will get in touch with you shortly. " +
    "We appreciate your interest in Tekton Elevators."
  );


} catch (error) {

  /*
    Allow another attempt if the request failed.
  */

  leadSaved = false;

}
```

}

/* ============================================================
OPTIONAL MANUAL CUSTOMER DATA FROM BACKEND
============================================================ */

window.TEKTON_ASSIST = {

```
open: openAssistant,

close: closeAssistant,

getCustomerData:
  function () {

    return Object.assign(
      {},
      customerData
    );

  }
```

};

/* ============================================================
INPUT EVENTS
============================================================ */

send.addEventListener(
"click",
sendMessage
);

input.addEventListener(
"keydown",
function (event) {

```
  if (
    event.key === "Enter" &&
    !event.shiftKey
  ) {

    event.preventDefault();

    sendMessage();

  }

}
```

);

})();
