require("dotenv").config();
const { sendCertificateEmail } = require("./src/services/emailService");

async function test() {
  const result = await sendCertificateEmail({
    to: "badges.cesae.digital@gmail.com",
    participantName: "Ana Silva",
    eventTitle: "Workshop de JavaScript",
    validationCode: "CESAE-1234-5678-9012",
    badgeUrl: null,
    pdfUrl: null,
  });
  console.log(result);
}

test();
