document.addEventListener("DOMContentLoaded", function () {

// ===== CONFIG =====

const RAZORPAY_KEY = "rzp_live_871H2Jybngmseo";

const GOOGLE_SCRIPT_URL =
"https://script.google.com/macros/s/AKfycby5meZOB4YNiMVBzyFV9Fq9Wksc3c8mKZljrUhqc_3_HZ2g87SFyLts23nov8NtWAqNvA/exec";


// ===== MODAL SYSTEM =====

const modal = document.getElementById('sessionModal');
const openBtns = document.querySelectorAll('.openSessionForm');
const closeBtn = document.querySelector('.close');

openBtns.forEach(btn => {
btn.addEventListener('click', () => {
modal.style.display = 'block';
});
});

if(closeBtn){
closeBtn.addEventListener('click', () => {
modal.style.display = 'none';
});
}

window.addEventListener('click', (e) => {
if (e.target === modal) modal.style.display = 'none';
});

// AUTO OPEN POPUP FROM URL
window.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const openSession = urlParams.get('session');
  if (openSession === 'book') {
    modal.style.display = 'block';
  }
});

// ===== FORM ELEMENTS =====

const internalForm = document.getElementById('internalSessionForm');
const preferredTimeInput = document.getElementById('preferredTime');
const mobileInput = document.getElementById('mobile');

if(!internalForm) return;


// ===== MOBILE VALIDATION =====

if(mobileInput){
mobileInput.addEventListener('input', () => {
mobileInput.value = mobileInput.value.replace(/\D/g, '');
});
}


// ===== BLOCKED DATES =====

const blockedDates = [
"2025-11-22",
"2025-11-30"
];

function isDateBlocked(dateTimeValue) {

const date = new Date(dateTimeValue);

const y = date.getFullYear();
const m = String(date.getMonth() + 1).padStart(2, '0');
const d = String(date.getDate()).padStart(2, '0');

return blockedDates.includes(`${y}-${m}-${d}`);

}


// ===== 24 HOUR RULE =====

(function setMinPreferredTime(){

const now = new Date();

const minDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);

const year = minDate.getFullYear();
const month = String(minDate.getMonth() + 1).padStart(2,'0');
const day = String(minDate.getDate()).padStart(2,'0');
const hours = String(minDate.getHours()).padStart(2,'0');
const minutes = String(minDate.getMinutes()).padStart(2,'0');

preferredTimeInput.min = `${year}-${month}-${day}T${hours}:${minutes}`;

})();


// ===== AM PM FORMAT =====

function convertToAMPM(dateTimeValue){

const date = new Date(dateTimeValue);

const hours = date.getHours();
const minutes = String(date.getMinutes()).padStart(2,'0');

const ampm = hours >= 12 ? "PM" : "AM";
const hr12 = hours % 12 || 12;

return `${date.toLocaleDateString()} ${hr12}:${minutes} ${ampm}`;

}


// ===== TIME WINDOW =====

function isTimeAllowed(dateTimeValue){

const date = new Date(dateTimeValue);

const day = date.getDay();
const hours = date.getHours();

if(day === 0){
return hours >= 9 && hours < 21;
}

return hours >= 18 && hours < 22;

}


// ===== FORM SUBMIT =====

internalForm.addEventListener('submit', function(e){

e.preventDefault();

const preferredTimeRaw = preferredTimeInput.value;

if (isDateBlocked(preferredTimeRaw)) {
alert("Selected date unavailable");
return;
}

if (!isTimeAllowed(preferredTimeRaw)) {
alert("Sunday: 9 AM – 9 PM\nOther days: 6 PM – 10 PM only.");
return;
}

const name = document.getElementById('name').value;
const email = document.getElementById('email').value;
const mobile = document.getElementById('mobile').value;
const sessionType = document.getElementById('sessionType').value;

const preferredTimeReadable = convertToAMPM(preferredTimeRaw);


// ===== RAZORPAY OPTIONS =====

const options = {

key: RAZORPAY_KEY,

amount: 19900,

currency: "INR",

name: "Distribution Blueprint",

description: "30 Minute Session",

image: "https://www.distributionblueprint.in/media/backimage.jpeg",

prefill: {
name: name,
email: email,
contact: mobile
},

handler: function(response){

    const paymentId = response.razorpay_payment_id;

    // ==========================================
    // SAVE BOOKING TO GOOGLE SHEET
    // Using normal POST form instead of fetch
    // ==========================================

    const iframeName = "googleSheetSubmitFrame_" + Date.now();

    const iframe = document.createElement("iframe");
    iframe.name = iframeName;
    iframe.style.display = "none";

    document.body.appendChild(iframe);

    const form = document.createElement("form");

    form.method = "POST";
    form.action = GOOGLE_SCRIPT_URL;
    form.target = iframeName;
    form.style.display = "none";

    // Name
    const nameField = document.createElement("input");
    nameField.type = "hidden";
    nameField.name = "name";
    nameField.value = name;
    form.appendChild(nameField);

    // Email
    const emailField = document.createElement("input");
    emailField.type = "hidden";
    emailField.name = "email";
    emailField.value = email;
    form.appendChild(emailField);

    // Mobile
    const mobileField = document.createElement("input");
    mobileField.type = "hidden";
    mobileField.name = "mobile";
    mobileField.value = mobile;
    form.appendChild(mobileField);

    // Session Type
    const sessionTypeField = document.createElement("input");
    sessionTypeField.type = "hidden";
    sessionTypeField.name = "sessionType";
    sessionTypeField.value = sessionType;
    form.appendChild(sessionTypeField);

    // Preferred Time
    const preferredTimeField = document.createElement("input");
    preferredTimeField.type = "hidden";
    preferredTimeField.name = "preferredTime";
    preferredTimeField.value = preferredTimeReadable;
    form.appendChild(preferredTimeField);

    // Razorpay Payment ID
    const paymentIdField = document.createElement("input");
    paymentIdField.type = "hidden";
    paymentIdField.name = "paymentId";
    paymentIdField.value = paymentId;
    form.appendChild(paymentIdField);

    document.body.appendChild(form);

    // Submit data to Google Apps Script
    form.submit();

    // ==========================================
    // CONFIRMATION + EMAIL
    // ==========================================

    setTimeout(function(){

    modal.style.display = 'none';
    internalForm.reset();

    alert("Payment successful! Your booking request has been recorded.");

}, 1500);

}

    } else {

        console.error("Google Sheet Error:", result);

        alert(
            "Payment successful, but booking data could not be saved. " +
            "Please contact us with Payment ID: " + paymentId
        );
    }

})
.catch(error => {

    console.error("Fetch Error:", error);

    alert(
        "Payment successful, but there was an issue saving your booking. " +
        "Please contact us with Payment ID: " + paymentId
    );

});


// ===== OPEN RAZORPAY =====

const rzp = new Razorpay(options);
rzp.open();

});

});



// document.addEventListener("DOMContentLoaded", function () {

// // ===== CONFIG =====

// const RAZORPAY_KEY = "rzp_live_871H2Jybngmseo";

// const GOOGLE_SCRIPT_URL =
// "https://script.google.com/macros/s/AKfycby5meZOB4YNiMVBzyFV9Fq9Wksc3c8mKZljrUhqc_3_HZ2g87SFyLts23nov8NtWAqNvA/exec";


// // ===== FORM ELEMENTS =====

// const internalForm = document.getElementById('internalSessionForm');
// const preferredTimeInput = document.getElementById('preferredTime');
// const mobileInput = document.getElementById('mobile');

// if(!internalForm) return;


// // ===== MOBILE VALIDATION =====

// if(mobileInput){
// mobileInput.addEventListener('input', () => {
//   mobileInput.value = mobileInput.value.replace(/\D/g, '');
// });
// }


// // ===== BLOCKED DATES =====

// const blockedDates = [
//   "2025-11-22",
//   "2025-11-30"
// ];

// function isDateBlocked(dateTimeValue) {
//   const date = new Date(dateTimeValue);
//   const y = date.getFullYear();
//   const m = String(date.getMonth() + 1).padStart(2, '0');
//   const d = String(date.getDate()).padStart(2, '0');
//   return blockedDates.includes(`${y}-${m}-${d}`);
// }


// // ===== 24 HOUR RULE =====

// (function setMinPreferredTime() {

//   const now = new Date();
//   const minDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);

//   const year = minDate.getFullYear();
//   const month = String(minDate.getMonth() + 1).padStart(2, '0');
//   const day = String(minDate.getDate()).padStart(2, '0');
//   const hours = String(minDate.getHours()).padStart(2, '0');
//   const minutes = String(minDate.getMinutes()).padStart(2, '0');

//   const formattedMin = `${year}-${month}-${day}T${hours}:${minutes}`;
//   preferredTimeInput.min = formattedMin;

// })();


// // ===== AM PM FORMAT =====

// function convertToAMPM(dateTimeValue) {

//   const date = new Date(dateTimeValue);

//   const hours = date.getHours();
//   const minutes = String(date.getMinutes()).padStart(2, '0');

//   const ampm = hours >= 12 ? "PM" : "AM";
//   const hr12 = hours % 12 || 12;

//   return `${date.toLocaleDateString()} ${hr12}:${minutes} ${ampm}`;

// }


// // ===== TIME WINDOW =====

// function isTimeAllowed(dateTimeValue) {

//   const date = new Date(dateTimeValue);
//   const day = date.getDay();
//   const hours = date.getHours();

//   if (day === 0) {
//     return hours >= 9 && hours < 21;
//   }

//   return hours >= 18 && hours < 22;

// }


// // ===== FORM SUBMIT =====

// internalForm.addEventListener('submit', function(e){

// e.preventDefault();

// const preferredTimeRaw = preferredTimeInput.value;

// if (isDateBlocked(preferredTimeRaw)) {
//   alert("Selected date unavailable");
//   return;
// }

// if (!isTimeAllowed(preferredTimeRaw)) {
//   alert("Sunday: 9 AM – 9 PM\nOther days: 6 PM – 10 PM only.");
//   return;
// }

// const name = document.getElementById('name').value;
// const email = document.getElementById('email').value;
// const mobile = document.getElementById('mobile').value;
// const sessionType = document.getElementById('sessionType').value;

// const preferredTimeReadable = convertToAMPM(preferredTimeRaw);


// // ===== RAZORPAY =====

// const options = {

// key: RAZORPAY_KEY,

// amount: 100,

// currency: "INR",

// name: "Distribution Blueprint",

// description: "30 Minute Session",

// image: "https://www.distributionblueprint.in/media/backimage.jpeg",

// handler: function (response) {

// const paymentId = response.razorpay_payment_id;

// // SEND DATA TO SHEET
// fetch(GOOGLE_SCRIPT_URL, {

// method: "POST",

// body: new URLSearchParams({
// name:name,
// email:email,
// mobile:mobile,
// sessionType:sessionType,
// preferredTime:preferredTimeReadable,
// paymentId:paymentId
// })

// })
// .then(()=>{

// alert("Payment successful! Your booking request has been recorded.");

// const mailtoLink =
// `mailto:contact@distributionblueprint.in?subject=Session Booking Request`
// +
// `&body=Name: ${name}`
// +
// `%0AEmail: ${email}`
// +
// `%0AMobile: ${mobile}`
// +
// `%0ASession Type: ${sessionType}`
// +
// `%0APreferred Time: ${preferredTimeReadable}`
// +
// `%0APayment ID: ${paymentId}`;

// window.location.href = mailtoLink;

// });

// }

// };

// // Razorpay open
// const rzp = new Razorpay(options);
// rzp.open();



// // const options = {

// // key: RAZORPAY_KEY,

// // amount: 100,

// // currency: "INR",

// // name: "Distribution Blueprint",

// // description: "30 Minute Session",

// // image: "https://www.distributionblueprint.in/media/backimage.jpeg",




// // handler: function (response) {

// // const paymentId = response.razorpay_payment_id;


// // // ===== SAVE DATA TO GOOGLE SHEET =====

// // fetch(GOOGLE_SCRIPT_URL, {

// // method: "POST",

// // headers: {
// // "Content-Type": "application/x-www-form-urlencoded"
// // },

// // body: `name=${name}&email=${email}&mobile=${mobile}&sessionType=${sessionType}&preferredTime=${preferredTimeReadable}&paymentId=${paymentId}`

// // });

// // // SUCCESS ALERT
// // alert("Payment successful! Your booking request has been recorded.");

// // // ===== OPEN MAIL AFTER PAYMENT =====

// // const mailtoLink =

// // `mailto:contact@distributionblueprint.in?subject=Session Booking Request` +
// // `&body=Name: ${name}` +
// // `%0AEmail: ${email}` +
// // `%0AMobile: ${mobile}` +
// // `%0ASession Type: ${sessionType}` +
// // `%0APreferred Time: ${preferredTimeReadable}` +
// // `%0APayment ID: ${paymentId}`;

// // window.location.href = mailtoLink;

// // }

// // };





// // handler: function (response) {

// // const paymentId = response.razorpay_payment_id;

// // // ===== SEND DATA TO GOOGLE SHEET =====

// // fetch(GOOGLE_SCRIPT_URL, {

// // method: "POST",

// // body: new URLSearchParams({
// // name:name,
// // email:email,
// // mobile:mobile,
// // sessionType:sessionType,
// // preferredTime:preferredTimeReadable,
// // paymentId:paymentId
// // })

// // })
// // .then(()=>{

// // alert("Payment successful! Your booking request has been recorded.");

// // // MAIL LINK
// // const mailtoLink =
// // `mailto:contact@distributionblueprint.in?subject=Session Booking Request`
// // +
// // `&body=Name: ${name}`
// // +
// // `%0AEmail: ${email}`
// // +
// // `%0AMobile: ${mobile}`
// // +
// // `%0ASession Type: ${sessionType}`
// // +
// // `%0APreferred Time: ${preferredTimeReadable}`
// // +
// // `%0APayment ID: ${paymentId}`;

// // window.location.href = mailtoLink;

// // });

// // }

// // };

// // // Razorpay open OUTSIDE handler
// // const rzp = new Razorpay(options);
// // rzp.open();


// // ===== MODAL SYSTEM (UNCHANGED) =====

// const modal = document.getElementById('sessionModal');
// const openBtns = document.querySelectorAll('.openSessionForm');
// const closeBtn = document.querySelector('.close');

// openBtns.forEach(btn => {
// btn.addEventListener('click', () => {
// modal.style.display = 'block';
// });
// });

// if(closeBtn){
// closeBtn.addEventListener('click', () => {
// modal.style.display = 'none';
// });
// }

// window.addEventListener('click', (e) => {
// if (e.target === modal) modal.style.display = 'none';
// });

// });

// // // mailto: form submission
// // const internalForm = document.getElementById('internalSessionForm');
// // const successMsg = document.getElementById('formSuccessMsg');
// // const preferredTimeInput = document.getElementById('preferredTime');

// // // >>> Only number enter in box <<<
// // const mobileInput = document.getElementById('mobile');

// // mobileInput.addEventListener('input', () => {
// //   mobileInput.value = mobileInput.value.replace(/\D/g, '');
// // });

// // // >>> ADD THIS PART (BLOCKED DATES) <<<
// // const blockedDates = [
// //   "2025-11-22",
// //   "2025-11-30"
// //   // add more dates here
// // ];

// // function isDateBlocked(dateTimeValue) {
// //   const date = new Date(dateTimeValue);
// //   const y = date.getFullYear();
// //   const m = String(date.getMonth() + 1).padStart(2, '0');
// //   const d = String(date.getDate()).padStart(2, '0');
// //   return blockedDates.includes(`${y}-${m}-${d}`);
// // }

// // // ---- 24-HOUR RESTRICTION USING LOCAL TIME ----
// // (function setMinPreferredTime() {
// //   const now = new Date();
// //   const minDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);

// //   const year = minDate.getFullYear();
// //   const month = String(minDate.getMonth() + 1).padStart(2, '0');
// //   const day = String(minDate.getDate()).padStart(2, '0');
// //   const hours = String(minDate.getHours()).padStart(2, '0');
// //   const minutes = String(minDate.getMinutes()).padStart(2, '0');

// //   const formattedMin = `${year}-${month}-${day}T${hours}:${minutes}`;
// //   preferredTimeInput.min = formattedMin;
// // })();

// // // ---- CONVERT TO AM/PM FORMAT ----
// // function convertToAMPM(dateTimeValue) {
// //   const date = new Date(dateTimeValue);
// //   const hours = date.getHours();
// //   const minutes = String(date.getMinutes()).padStart(2, '0');

// //   const ampm = hours >= 12 ? "PM" : "AM";
// //   const hr12 = hours % 12 || 12;

// //   return `${date.toLocaleDateString()} ${hr12}:${minutes} ${ampm}`;
// // }

// // // ---- ALLOWED TIME WINDOW: 8 AM to 9 PM ----
// // // function isTimeAllowed(dateTimeValue) {
// // //   const date = new Date(dateTimeValue);
// // //   const hours = date.getHours();
// // //   return hours >= 8 && hours < 21;  // 8:00–20:59 allowed
// // // }
// // // ---- ALLOWED TIME WINDOW (Sunday special) ----
// // function isTimeAllowed(dateTimeValue) {
// //   const date = new Date(dateTimeValue);
// //   const day = date.getDay(); // 0 = Sunday
// //   const hours = date.getHours();

// //   // Sunday: 9 AM – 9 PM
// //   if (day === 0) {
// //     return hours >= 9 && hours < 21; // 09:00–20:59
// //   }

// //   // Other days: 6 PM – 10 PM
// //   return hours >= 18 && hours < 22; // 18:00–21:59
// // }


// // // ---- FORM SUBMIT ----
// // internalForm.addEventListener('submit', (e) => {
// //   e.preventDefault();

// //   const preferredTimeRaw = preferredTimeInput.value;

// //   // >>> ADD THIS CHECK JUST BELOW <<<
// //   if (isDateBlocked(preferredTimeRaw)) {
// //     alert("Selected date is unavailable. Please choose another day.");
// //     return;
// //   }

// //   // ---- Block time outside 8AM–9PM ----
// //   if (!isTimeAllowed(preferredTimeRaw)) {
// //     // alert("Please select a time between 8 AM to 9 PM only.");
// //     // return;
// //     alert("Sunday: 9 AM – 9 PM\nOther days: 6 PM – 10 PM only.");
// //   return;
// //   }

// //   const preferredTimeReadable = convertToAMPM(preferredTimeRaw);

// //   const name = encodeURIComponent(document.getElementById('name').value);
// //   const email = encodeURIComponent(document.getElementById('email').value);
// //   const mobile = encodeURIComponent(document.getElementById('mobile').value);
// //   const sessionType = encodeURIComponent(document.getElementById('sessionType').value);

// //   const mailtoLink = 
// //     `mailto:contact@distributionblueprint.in?subject=Session Booking Request` +
// //     `&body=Name: ${name}%0AEmail: ${email}%0AMobile (WhatsApp): ${mobile}%0ASession Type: ${sessionType}` +
// //     `%0APreferred Time: ${encodeURIComponent(preferredTimeReadable)}`;

// //   window.location.href = mailtoLink;

// //   successMsg.style.display = 'block';
// //   internalForm.reset();
// // });




// // // Modal Open/Close
// // const modal = document.getElementById('sessionModal');
// // const openBtns = document.querySelectorAll('.openSessionForm'); // class se multiple buttons select
// // const closeBtn = document.querySelector('.close');

// // // Loop through all open buttons
// // openBtns.forEach(btn => {
// //   btn.addEventListener('click', () => {
// //     modal.style.display = 'block';
// //   });
// // });

// // // Close button
// // closeBtn.addEventListener('click', () => {
// //   modal.style.display = 'none';
// // });

// // // Close modal if click outside content
// // window.addEventListener('click', (e) => {
// //   if (e.target === modal) modal.style.display = 'none';
// // });

// // // Auto open popup if URL contains ?session=book
// // window.addEventListener('DOMContentLoaded', () => {
// //   const urlParams = new URLSearchParams(window.location.search);
// //   const openSession = urlParams.get('session');
// //   if (openSession === 'book') {
// //     modal.style.display = 'block';
// //   }
// // });

// // // about new timings
// // // ===== GLOBAL TIMING NOTICE (SAFE & WORKING) =====
// // window.addEventListener('DOMContentLoaded', () => {

// //   // Create notice modal
// //   const noticeModal = document.createElement('div');
// //   noticeModal.id = 'timingNoticeModal';
// //   noticeModal.style.cssText = `
// //     display:none;
// //     position:fixed;
// //     inset:0;
// //     background:rgba(0,0,0,0.6);
// //     z-index:10001;
// //   `;

// //   noticeModal.innerHTML = `
// //     <div style="
// //       background:#fff;
// //       max-width:420px;
// //       margin:15% auto;
// //       padding:20px;
// //       border-radius:8px;
// //       position:relative;
// //       text-align:center;
// //     ">
// //       <span id="timingNoticeClose" style="
// //         position:absolute;
// //         top:10px;
// //         right:15px;
// //         cursor:pointer;
// //         font-size:22px;
// //       ">&times;</span>

// //       <h3  style="color:red;">⏰ New Session Timings</h3>
// //       <p>
// //         <strong>Sunday:</strong> 9 AM – 9 PM<br>
// //         <strong>Monday–Saturday:</strong> 6 PM – 10 PM
// //       </p>

// //       <button id="timingNoticeContinue" style="
// //         margin-top:15px;
// //         padding:8px 16px;
// //         cursor:pointer;
// //       ">Continue</button>
// //     </div>
// //   `;

// //   document.body.appendChild(noticeModal);

// //   const closeBtn = document.getElementById('timingNoticeClose');
// //   const continueBtn = document.getElementById('timingNoticeContinue');
// //   const sessionModal = document.getElementById('sessionModal');

// //   // 🔥 Remove old click behaviour & intercept
// //   document.querySelectorAll('.openSessionForm').forEach(btn => {
// //     btn.onclick = null; // kill old listeners

// //     btn.addEventListener('click', (e) => {
// //       e.preventDefault();
// //       noticeModal.style.display = 'block';
// //     });
// //   });

// //   // Close notice
// //   closeBtn.addEventListener('click', () => {
// //     noticeModal.style.display = 'none';
// //   });

// //   // Continue → open real form
// //   continueBtn.addEventListener('click', () => {
// //     noticeModal.style.display = 'none';
// //     if (sessionModal) sessionModal.style.display = 'block';
// //   });

// // });
