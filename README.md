# amazon-link-resolver
mixmax link resolver for amazon product previews

Disclaimer: this probably violates Amazon's terms of service

Created by modifying <a href="https://github.com/mixmaxhq/giphy-example-link-resolver">Mixmax's giphy example link resolver</a>.

## Running locally

1. Install using `npm install`
2. Run using `npm start`

To simulate locally how Mixmax calls the resolver URL (to return HTML that goes into the email), run:

```
curl http://localhost:9147/resolver?url=https%3A%2F%2Fwww.amazon.com%2FMagswitch-MAGJIG-95-MagJig%2Fdp%2FB003FWERRC%2F
```
