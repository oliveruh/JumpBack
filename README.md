# JumpBack - Find Your Shonen Jump Birth Issue 
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)](https://developer.mozilla.org/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)](https://developer.mozilla.org/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)](https://developer.mozilla.org/docs/Web/JavaScript)
![Hosted on Neocities](https://img.shields.io/badge/Hosted_on-Neocities-1f91a9?style=flat-square&logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAA35JREFUOE+Nk29sk1UUxp/bvv3Pui1ruxVmYbhJdHMDUlNnNM7BTBhzYNCOQlwQ2ZzOBYSJGUIALRNjYlA3ky2YwDJicPgntoEgVueGyHChbaRJ9wHeOZp2W6tZu7ZrWd97zdtkfFET76fz4Z7fved5zkPwPw5jjKRSqScppfmzs7Pfl5SUpJbaiFgwxqSEEOG/WIyxYq/X+5PbfdO4aVP9qUAg0G02m5PifcIYe5BS2hKNRs/l5+ffIoSwJZD4MgDF/Px8++G395+MT1zknmm2p+qf29Llcrk+tVqtAkmn08c8Hs9hk8nEcxzXqtPpRgFoM5nMulQq9UQ8HrdM3rlj+eKDXbo3a5Q4+bMcBz/6MpBIJOoqKyv9JBaLfbvTZt2yokCDvV32KaPReCkSiWz47fovK369Oqyg4d8lyxDF1gopKh5Q4wdfDJPFLULTjubu0dHR4yQcDt+wNTz92KENAr6eyIFhZQUjYQ+pMiRRqpehUCsDxxFICQEhwFwyg6M/anC894LP6XTWkEgkcmvb5tryM00MKrkEGYEhRyUFJyEgKiOI7hEIgWGAClkAZQw9rjms3/VZvMi4vE4cwfVKs632HTOPsiLlfSMYA1jeo1BvtONa706k54OoLtNieu4eus7fRenGtsWXd+95XfT34277ux2m0DmyvboAWV8BTIZTuOxLo+3I57h9w4E0fxkPL5cjkRYw4o9hhNYJbe37jokuvOh2uwdPvbVN3mPTQymXZAGxZAZ8JIO19QcwhZUooNNQ8BcgxCbRc2UaIX2D0NrWfkgU0ahUKq92vLZndY3qelaD6rJlWKVXguWU4q91R/D+q51QqFRo3f8CTFO9cN4M4881byTXmy02cZEkCwsLnV6vx/5S0/OyzloZ6iryoFVJQfWP45vZcgRPn4dar0PrJwfgH9oLx/Qa1txx1DUwMLAjOzLP83kGg+H02bNntn7V955UKsRxsMGItQ+tgvSpE+DnCCb8fvzhuQKmzKXW3ftu+3y+lsbGxpElzTAzM1OoUChO+P3+7Red36kjd/1Efi8CraEEcn0pCguLBIvFksjNzb00Njb2odVq9QAQ7gPEnzgcDnVVVdWzGo2mHkA5pbSYEJKmlPLRaPRaKBQaHhwc9PT398fEDGbD9G8J7Ovrk2k0GlUwGFQvLi4yjuOS4+PjyaGhoX8k9m//O4qljSZLKAAAAABJRU5ErkJggg==)

**Travel back in time and discover the _Weekly Shonen Jump_ issue with the closest recorded cover date on or before your birthday!**

<p align="center">
  <img src="https://jumpback.veramonte.org/assets/images/logo.png" alt="JumpBack Cover Preview"/>
</p>
 
## About the Project 
 
**JumpBack** is a nostalgic static web app hosted on Neocities. Enter your birthdate to see the magazine cover, archive issue number, and recorded manga contents associated with the closest cover date on or before your date. Cover dates may differ from actual sale dates. The current archive covers **1968-08-01 through 2021-05-24**; dates outside that range are not extrapolated.

Whether you’re a lifelong fan of the magazine or just manga-curious, it’s a fun, personal way to connect with manga history. 🎌
 
## How It Works 
 
1. 📅 Select your birthdate using the calendar
2. The app finds the latest recorded *Shonen Jump* cover date *on or before* that date
3. 🖼️ You get the cover, issue number, and featured manga list

> All issue and series data are sourced from a curated JSON dataset built using the Comic Vine API and Manga Updates API.

## New Features

- [x] **Magazine Reveal**: A cover-first result card with up to three identified series from the recorded contents, without a popularity ranking
- [x] **Statistics and Trivia**: Category counts and existing archive trivia, loaded on demand
- [x] **WSJ Horoscope**: A playful character/sign association using the existing localized dataset
- [x] **Hidden Gem**: The identified series with the fewest positive MangaUpdates votes in the saved data, with rating as a tie-breaker
- [x] **Sharing**: Native share, clipboard and manual-copy fallbacks, in English and Brazilian Portuguese

## Development and validation

Serve `src` using a static HTTP server. Deployment still uploads that directory
directly; there is no production build or backend. See
[Dev Alley 2027 audit, measurements and limitations](docs/dev-alley-2027.md).

```bash
npm ci
npx playwright install chromium
npm test
npm run catalog:check
npm run test:smoke
```

Historical source JSON files are preserved. After an intentional data update, run
`npm run catalog` to regenerate the committed compact index/year files. Use
`npm run measure` for a reproducible local dataset-loading benchmark.
 
## Website 
 
👉 [**JumpBack - Live Here**](https://jumpback.veramonte.org) 
 
## Credits 
 
- Issue data sourced from **Comic Vine** API
- Series data sourced from **Manga Updates** API
- Project created by [@oliveruh_](https://twitter.com/oliveruh_)
- Special thanks to the manga community for their continued support and thank you for making this project reach 100K+ views on Neocities

## Support

- **Tip me**: 
    - Your tips help cover hosting costs and motivate future updates.  
    - [![Donate via PayPal](https://img.shields.io/badge/Donate-PayPal-0070ba?logo=paypal&logoColor=white)](https://www.paypal.com/donate/?hosted_button_id=Z74ZYG2XLA4KQ)

- **Support the Weekly Shonen Jump**: 
    - <a href="https://www.viz.com/shonenjump" target="_blank" rel="noopener noreferrer">Read the latest chapters on VIZ!</a>

- **Spread the word**: 
    - Share [**JumpBack**](https://jumpback.veramonte.org) with your friends and fellow shonen fanatics!

 - **Suggest improvements and give feedback**:
    - Have suggestions or feedback? Open an issue on GitHub or reach out!
