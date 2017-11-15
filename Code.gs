function buildAddOn(e) {
  var accessToken = e.messageMetadata.accessToken;
  GmailApp.setCurrentMessageAccessToken(accessToken);

  var messageId = e.messageMetadata.messageId;
  var mail = GmailApp.getMessageById(messageId);
  var mail_body = mail.getPlainBody();
  var pnr = extractPNR(mail_body);
  var cards = [];

  if (pnr) {
    var data = getPNRdetails(pnr);
    if (data["response_code"] == 200 && data["train_name"]) {
    var card_data = {
      "Boarding point": data["boarding_point"]["name"],
      "Destination": data["reservation_upto"]["name"],
      "Train name": data["train_name"],
      "Current status": data["passengers"][0]["current_status"],
      "Booking status": data["passengers"][0]["booking_status"],
      "Coach position": data["passengers"][0]["coach_position"],
      "Chart prepared": data["chart_prepared"],
      "Date of journey": data["doj"],
      "Journey class": data["journey_class"]["name"],
    };
    }
    else {
       var card_data = {"Status": "Empty train number"};
    }
    cards.push(ticketStatusCard(card_data));
  } else {
      cards.push(CardService.newCardBuilder()
        .setHeader(CardService.newCardHeader()
        .setTitle('No PNR found in this mail')).build());
  }
  return cards;
}

function getPNRdetails(pnr) {
  var API_KEY = "API_KEY";
  var base_url = "https://api.railwayapi.com/v2/pnr-status/pnr/";
  var url = base_url + pnr + "/apikey/" + API_KEY + "/";
  Logger.log(pnr);
  Logger.log(url);
  var response = UrlFetchApp.fetch(url);
  var status_code = response.getResponseCode();
  if (status_code == 200) {
     Logger.log(JSON.parse(response.getContentText()));
     var data = JSON.parse(response.getContentText());
     return data;
  } else if (status_code == 220) {
     return {"Status" : "Flushed PNR"};
  } else if (status_code == 221) {
     return {"Status" : "Invalid PNR"};
  } else {
     return {"Status code" : status_code};
  }
}

function extractPNR(body) {
  var regex = /PNR No.\s*:\*\s*(\d+)/;
  var match = regex.exec(body);
  if (match) {
    var pnr = match[1];
    return pnr.toString();
  }
}

function ticketStatusCard(data) {
  var card = CardService.newCardBuilder();
  card.setHeader(CardService.newCardHeader().setTitle('<font color=\"#1257e0\">Ticket status</font>'));
  var section = CardService.newCardSection();

  for (var key in data) {
    section.addWidget(CardService.newKeyValue()
      .setTopLabel(key)
      .setContent(data[key]));
  }

  card.addSection(section);
  return card.build();
}
