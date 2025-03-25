import {
    LitElement,
    html,
    css,
    property
} from "https://unpkg.com/lit-element@2.3.1/lit-element.js?module";

class TankerkoenigCard extends LitElement {
    static get properties() {
        return {
            hass: {},
            config: {}
        };
    }

    render() {
        this.stations.sort((a, b) => {
            let key = '';

            if (a.diesel) {
                key = 'diesel';
            } else if (a.e5) {
                key = 'e5';
            } else if (a.e10) {
                key = 'e10';
            }

            if (this.hass.states[a[key]].state === 'unknown' || this.hass.states[a[key]].state === 'unavailable') {
                return 1;
            }

            if (this.hass.states[b[key]].state === 'unknown' || this.hass.states[b[key]].state === 'unavailable') {
                return -1;
            }

            if (this.hass.states[a[key]].state > this.hass.states[b[key]].state) return 1;
            if (this.hass.states[b[key]].state > this.hass.states[a[key]].state) return -1;

            return 0;
        });

        let header = '';

        if (this.show_header === true) {
            header = this.config.name || 'Tankerkönig';
        }

        return html`<ha-card elevation="2" header="${header}">
            <div class="container">
                <table width="100%">
                    ${this.stations.map((station) => {

            if (!this.isOpen(station) && this.config.show_closed !== true) return;

            return html`<tr>
                        ${this.renderGasStationLogo(station.brand)}
                        <td class="name">${station.name}</td>
                        ${this.renderPrice(station, 'e5')}
                        ${this.renderPrice(station, 'e10')}
                        ${this.renderPrice(station, 'diesel')}
                        </tr>`;
        })}
                </table>
            </div>
        </ha-card>`;
    }

    getStationState(station) {
        let state = null;

        if (this.has.e5) {
            state = this.hass.states[station.e5] || null;
        } else if (this.has.e10) {
            state = this.hass.states[station.e10] || null;
        } else if (this.has.diesel) {
            state = this.hass.states[station.diesel] || null;
        }

        return state;
    }

    isOpen(station) {
        const state = this.hass.states[station.state].state;
        return state == "on";
    }

    renderGasStationLogo(brand) {
        let iconSize = this.config.icon_size || 30;
        if (brand) {
            return html`<td class="logo"><img height="${iconSize}" width="${iconSize}" src="/local/gasstation_logos/${brand.toLowerCase()}.png"></td>`;
        } else {
            return html`<td class="logo"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style="height: ${iconSize}px"><title>gas-station-outline</title><path d="M19.77,7.23L19.78,7.22L16.06,3.5L15,4.56L17.11,6.67C16.17,7.03 15.5,7.93 15.5,9A2.5,2.5 0 0,0 18,11.5C18.36,11.5 18.69,11.42 19,11.29V18.5A1,1 0 0,1 18,19.5A1,1 0 0,1 17,18.5V14A2,2 0 0,0 15,12H14V5A2,2 0 0,0 12,3H6A2,2 0 0,0 4,5V21H14V13.5H15.5V18.5A2.5,2.5 0 0,0 18,21A2.5,2.5 0 0,0 20.5,18.5V9C20.5,8.31 20.22,7.68 19.77,7.23M12,13.5V19H6V12H12V13.5M12,10H6V5H12V10M18,10A1,1 0 0,1 17,9A1,1 0 0,1 18,8A1,1 0 0,1 19,9A1,1 0 0,1 18,10Z" /></svg></td>`;
        }
    }

    renderPrice(station, type) {
        // skip if not configured
        if (!this.has[type]) {
            return;
        }

        const state = this.hass.states[station[type]] || null;

        // render gas info if station is open and has a price
        if (state && state.state != 'unknown' && state.state != 'unavailable' && this.isOpen(station)) {
            return html`<td><ha-label-badge
              label="${type.toUpperCase()}"
              @click="${() => this.fireEvent('hass-more-info', station[type])}"
              ><span style="font-size: 75%;">${this.renderGasPrice(state.state)}</span></ha-label-badge></td>`;
        } else if (state && !this.isOpen(station)) { // render lock badge if station is open but has no price
            return html`<td><ha-label-badge
              icon="mdi:lock-outline"
              label="${type.toUpperCase()}"
              @click="${() => this.fireEvent('hass-more-info', station[type])}"
              ></ha-label-badge></td>`;
        } else if (this.has[type] && !state) { // render placeholder if station has not a configured gas type
            return html`<td><ha-label-badge style="display: none;"
              label="${type.toUpperCase()}"
              ><span style="font-size: 75%;">N/A</span></ha-label-badge></td>`;
        } else {
            return;
        }
    }

    fireEvent(type, entityId, options = {}) {
        const event = new Event(type, {
            bubbles: options.bubbles || true,
            cancelable: options.cancelable || true,
            composed: options.composed || true,
        });
        event.detail = { entityId: entityId };
        this.dispatchEvent(event);
    }

    setConfig(config) {
        this.config = config;

        // set header visibility
        this.show_header = (this.config.show_header !== false) ? true : false;

        // set gas types visibility
        this.has = {
            e5: this.config.show.indexOf('e5') !== -1,
            e10: this.config.show.indexOf('e10') !== -1,
            diesel: this.config.show.indexOf('diesel') !== -1,
        };

        // set stations
        this.stations = this.config.stations.slice();
    }

    getCardSize() {
        return this.stations.length + 1;
    }

    /**
     * Checks configuration for rounding gas prices and renders the price accordingly 
     * 
     * @param {any} gasPrice
     * @returns Currency formatted gas price
     */
    renderGasPrice(gasPrice) {
        if (this.config.round_gas_prices !== false) {
            gasPrice = parseFloat(gasPrice).toFixed(2);
            return html`${gasPrice}&euro;`;
        }

        if (this.config.render_sup !== false && gasPrice.length >= 5) {
            return html`${state.state.substring(0, gasPrice.length - 1)}<sup>${state.state.substring(gasPrice.length - 2, gasPrice.length - 1)}</sup>&euro;`;
        } 

        return html`${gasPrice}&euro;`;
    }

    static get styles() {
        return css`
            .container { padding: 0 16px 16px; }
            td { text-align: center; padding-top: 10px; }
            td.name { text-align: left; font-weight: bold; }
            td.gasstation img { vertical-align: middle; }
            ha-label-badge { font-size: 85%; cursor: pointer; }
            .label-badge .value { font-size: 70%; }
        `;
    }
}

customElements.define('tankerkoenig-card', TankerkoenigCard);
