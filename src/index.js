import PostalMime from 'postal-mime';

async function streamToArrayBuffer(stream, streamSize) {
  let result = new Uint8Array(streamSize);
  let bytesRead = 0;
  const reader = stream.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    result.set(value, bytesRead);
    bytesRead += value.length;
  }
  return result;
}

export default {
  async email(message, env, ctx) {
    const rawEmail = await streamToArrayBuffer(message.raw, message.rawSize);
    const parser = new PostalMime.default();
    const parsedEmail = await parser.parse(rawEmail);

    console.log("Mail subject: ", parsedEmail.subject);
    console.log("Mail message ID", parsedEmail.messageId);
    console.log("HTML version of Email: ", parsedEmail.html);
    console.log("Text version of Email: ", parsedEmail.text);

    var bodyText = '';//'$$7752499396821,buy,XAUUSD1,risk=0.01,tp=200,sl=55,comment=BBS.76';
    var orderText = bodyText;
    var closeText = '';

    var onlyBuy = false;
    var onlySell = false;
    if (bodyText.startsWith('$')) {
      if (bodyText.startsWith('$$')) {
        if (bodyText.startsWith('$$B')) {
          orderText = bodyText.substring(3, bodyText.length);
          onlyBuy = true;
        } else if (bodyText.startsWith('$$S')) {
          orderText = bodyText.substring(3, bodyText.length);
          onlySell = true;
        } else {
          orderText = bodyText.substring(2, bodyText.length);
        }
        if (orderText.indexOf(',buy,') !== -1) {
          orderText = orderText.replace(/,buy,/g, ',sell,');
        } else if (orderText.indexOf(',sell,') !== -1) {
          orderText = orderText.replace(/,sell,/g, ',buy,');
        }
      } else if (bodyText.startsWith('$B')) {
        orderText = bodyText.substring(2, bodyText.length);
        onlyBuy = true;
      } else if (bodyText.startsWith('$S')) {
        orderText = bodyText.substring(2, bodyText.length);
        onlySell = true;
      } else if (bodyText.startsWith('$')) {
        orderText = bodyText.substring(1, bodyText.length);
      }

      if (orderText.indexOf(',buy,') !== -1) {
        closeText = orderText.replace(/(.*,)buy(,.*)(,risk.*)/g, '$1closeshort$2');
      } else if (orderText.indexOf(',sell,') !== -1) {
        closeText = orderText.replace(/(.*,)sell(,.*)(,risk.*)/g, '$1closelong$2');
      }
    }

    if (onlyBuy && orderText.indexOf(',sell,') !== -1) {
      orderText = '';
    }
    if (onlySell && orderText.indexOf(',buy,') !== -1) {
      orderText = '';
    }

    if (orderText.length > 0) {
      await fetch('https://webhook.pineconnector.com', {
        method: 'POST',
        headers: { 'Content-type': 'text/plain' },
        body: orderText,
      }).then(data => {
      });
    }

    if (closeText.length > 0) {
      await fetch('https://webhook.pineconnector.com', {
        method: 'POST',
        headers: { 'Content-type': 'text/plain' },
        body: closeText,
      }).then(data => {
      });
    }
  }
}
