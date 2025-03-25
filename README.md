# Tankerkoenig Lovelace Card

[![Version](https://img.shields.io/badge/version-1.2.0-green?style=square)](#) [![mantained](https://img.shields.io/maintenance/yes/2025?style=square)](#) [![hacs_badge](https://img.shields.io/badge/HACS-Custom-orange?style=square)](https://github.com/custom-components/hacs)

[![maintainer](https://img.shields.io/badge/maintainer-Second2None-blue?style=square)](#)

## Installation
1. Install this component by copying the `tankerkoenig-card.js` to your `/www/` folder.
2. Add this to your Lovelace-Configuration using the config options below example.
3. Put the icons as `*.png` for the brands in the `/www/gasstation_logos/` folder.

```yaml
resources:
  - url: /local/tankerkoenig-card.js?v=1.0.0
    type: js
views:
  - cards:
      - type: 'custom:tankerkoenig-card'
        name: Benzinpreise
        show:
          - e5
          - e10
        show_closed: true
        show_header: false
        round_gas_prices: false
        render_sup: true
        icon_size: 30
        sort_by_gas: diesel
        stations:
          - name: Kölner Str.
            brand: ARAL
            e5: sensor.aral_kolner_str_e5
            e10: sensor.aral_kolner_str_e10
            state: binary_sensor.aral_kolner_str_status
          - name: Untergath
            brand: ARAL
            e5: sensor.aral_untergath_e5
            e10: sensor.aral_untergath_e10
            state: binary_sensor.aral_untergath_status
```

### Options
| key           | values            | required | description
|---------------|-------------------|----------|---
| `name`        | String            | yes      | Name of the card that should be shown in the frontend
| `show`        | [e5, e10, diesel] | false      | What should be shown (default: e5, e10, diesel)
| `show_closed` | Boolean           | no       | Show closed stations (default: false)
| `show_header` | Boolean           | no       | Show card-header (default: true)
| `stations`    | List of stations  | yes      | List of stations
| `round_gas_prices` | Boolean      | no       | Round the gas prices to 2 decimal places (default: false)
| `render_sup`  | Boolean           | no       | Use the `<sup>` tag to render the last digit of gas prices (default: false, e.g. 1,59<sup>9</sup>&euro;). Ignored if `round_gas_prices` is set to `true`.
| `icon_size`   | Integer           | no       | Size of the icon (default: 30)
| `sort_by_gas`     | [e5, e10, diesel] | no       | Sort the stations by the given gas type (default: e5)

#### Stations
| key      | value  | required | description
|----------|--------|----------|---
| `name`   | String | yes      | The name of the station (for example the street)
| `brand`  | String | no       | The brand of the station used for the icon
| `e5`     | Sensor | no*      | Sensor for the E5 price
| `e10`    | Sensor | no*      | Sensor for the E10 price
| `diesel` | Sensor | no*      | Sensor for the diesel price
| `state`  | Sensor | yes      | Sensor of station state

*only required if it should be shown

## Additional
To use the icons you have to use lowercase names, which has to be the same as in the `brand` settings. The icons must be in `*.png` format.

### Example
For the brand ARAL there has to be an icon with the following path: `/www/gasstation_logos/aral.png`