var sync = require('synchronize');
var request = require('request');
var _ = require('underscore');
var cheerio = require('cheerio')

var ESC_MAP = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
};

function escapeHTML(s, forAttribute) {
    return s.replace(forAttribute ? /[&<>'"]/g : /[&<>]/g, function(c) {
        return ESC_MAP[c];
    });
}

// The API that returns the in-email representation.
module.exports = function(req, res) {
  var url = req.query.url.trim();

  // Amazon product urls are in the format:
  // https://www.amazon.com/<product>/<info>/<other info>/<optional user tracking info>
  var matches = url.match(/amazon\.com(\/.*\/\w*\/\w*\/).*$/);
  if (!matches) {
    res.status(400).send('Invalid URL format');
    return;
  }

  var productInfo = matches[1];

  var response;
  try {
    response = sync.await(request.get({
      url: 'https://www.amazon.com' + productInfo,
      headers: {
        'Host': 'www.amazon.com',
        'Connection': 'keep-alive',
        'Pragma': 'no-cache',
        'Cache-Control': 'no-cache',
        'Upgrade-Insecure-Requests': '1',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2785.116 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, sdch, br',
        'Accept-Language': 'en-US,en;q=0.8',
      },
      gzip: true,
      timeout: 15 * 1000,
    }, sync.defer()));
  } catch (e) {
    res.status(500).send('Error');
    return;
  }

  var $ = cheerio.load(response.body);
  var url = 'https://www.amazon.com' + productInfo;

  var imgSrc = escapeHTML($('#imgTagWrapperId img').attr('src'));
  var price = escapeHTML($('td #priceblock_ourprice').eq(0).text());
  var productTitle = escapeHTML($('#productTitle').eq(0).text());
  var availability = escapeHTML($('#availability').eq(0).text());
  var rating = escapeHTML($('#reviewStarsLinkedCustomerReviews').eq(0).text());
  var totalReviews = escapeHTML($('#acrCustomerReviewText').eq(0).text());

  res.json({
    body: `
    <div style=\ "height:4px; font-size:4px;\">
        <br>
    </div>
    <table id=\ "\" class=\ "card-v3\" cellpadding=\ "0\" cellspacing=\ "0\" style=\ "border:1px solid #f5ffff; border-radius:4px; width:100%; max-width:578px; mso-border-alt: none;\">
        <tr style=\ "border:1px solid #d5ecff; mso-border-alt:none; display:block; border-radius: 3px;\">
            <td style=\ "display:block; padding:8px; border-radius:2px; border:1px solid #99b0e1; font-size:0; vertical-align:top; background-color:white; mso-border-alt:none; position:relative;\">
                <table width=\ "100%\" border=\ "0\" cellpadding=\ "0\" cellspacing=\ "0\" valign=\ "top\" style=\ "border-collapse:separate; text-align:left;\">
                    <tr class=\ "\">
                        <td class=\ "palm-one-whole\" rowspan=\ "2\" valign=\ "top\" style=\ " width:134px;\">
                            <table width=\ "100%\" class=\ "inner\" border=\ "0\" cellpadding=\ "0\" cellspacing=\ "0\" valign=\ "top\" style=\ "border-collapse:separate; \">
                                <tr>
                                    <td valign=\ "top\" style=\ "padding: \">
                                        <a href=\ "${url}\" target=\ "_blank\" style=\ "display:block;\"><img src=\ "${imgSrc}\" class=\ "palm-one-whole\" width=\"120\" style=\ "display:block; width:120px; vertical-align:top;\" alt=\ "Preview image\" /></a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                        <td class=\ "palm-one-whole\" rowspan=\ "\" valign=\ "top\" style=\ "font-size:13px; width:px;\">
                            <table width=\ "100%\" class=\ "inner\" border=\ "0\" cellpadding=\ "0\" cellspacing=\ "0\" valign=\ "top\" style=\ "border-collapse:separate; font-size:13px;\">
                                <tr>
                                    <td valign=\ "top\" style=\ "padding: \">
                                        <table cellpadding=\ "0\" cellspacing=\ "0\" valign=\ "top\" style=\ "border-collapse:collapse\">
                                            <tr>
                                                <td colspan=\ "2\" valign=\ "top\" style=\ "min-width:100%;  padding-bottom: 2px; font-size:16px; line-height:22px;  font-weight:600;  font-family: 'Avenir Next', 'Segoe UI', 'Calibri', Arial, sans-serif;      \"> <a href=\ "${url}\" target=\ "_blank\" style=\ "text-decoration:none;  display:block;  color:#333;  border:none;\">${productTitle}</a>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td colspan=\ "2\" valign=\ "top\" style=\ "min-width:100%;  padding-bottom: 4px;  font-size:13px; line-height:17px;  font-family:'Segoe UI', 'Helvetica Neue', Helvetica, 'Calibri', Arial, sans-serif;      \"> <a href=\ "${url}\" target=\ "_blank\" style=\ "text-decoration:none;  display:block;  color:#333;  border:none;\">
                                                Price: ${price}<br>
                                                Availability: ${availability}<br>
                                                Rating: ${rating} from ${totalReviews}</a>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                        <tr>
                            <td valign=\ "bottom\">
                                <table width=\ "100%\" border=\ "0\" cellpadding=\ "0\" cellspacing=\ "0\" valign=\ "top\" style=\ "border-collapse:separate; \">
                                    <tr>
                                        <td valign=\ "bottom\" style=\ "line-height:11px; font-family: 'Avenir Next', 'Segoe UI', 'Calibri', Arial, sans-serif;\" class=\ "hostname\"> <a style=\ "color:#aab; display:block;  font-size:11px;  margin:0;  letter-spacing:1px;  padding-left: 1px; text-decoration:none;  text-transform:uppercase;\" href=\"${url}\" target=\ "_blank\">amazon.com</a> </td>
                                    </tr>
                                </table>
                                <td align=\ "right\" valign=\ "bottom\">
                                    <a href=\ "${url}\" style=\ "display:block;  vertical-align:top;  font-size:0;\" target=\ "_blank\"> <img src=\ "https://www.amazon.com/favicon.ico\" align=\ "top\" height=\ "20\" style=\ "display:block;\" alt=\ "Amazon\" border=\ "0\"/> </a>
                                </td>
                            </td>
                        </tr>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
    <div style=\ "height:4px; font-size:4px;\"><br></div>
    `
  });
};
