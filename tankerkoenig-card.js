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
            config: {},
            sortBy: 'e5'
        };
    }

    changeSortingKey(sortBy) {
        if (typeof this.config.sort_by_gas === 'undefined' && typeof sortBy === 'undefined') { // if sorting is not defined in configuration and sortBy is not set, default to e5
            // nothing to do
        } else if (typeof this.config.sort_by_gas === 'undefined' && typeof sortBy !== 'undefined') { // if sorting is not defined in configuration but sortBy is set, use sortBy
            this.sortBy = sortBy;
        } else if (typeof this.config.sort_by_gas !== 'undefined' && typeof sortBy === 'undefined') { // if sorting is defined in configuration but sortBy is not set, use configuration
            this.sortBy = this.config.sort_by_gas;
        } else if (typeof this.config.sort_by_gas !== 'undefined' && typeof sortBy !== 'undefined') { // if sorting is defined in configuration and sortBy is set, use sortBy
            this.sortBy = sortBy;
        } else { // fallback to default
            this.sortBy = 'e5';
        }
    }

    render(sortBy) {
        this.changeSortingKey(sortBy);

        this.stations.sort((a, b) => {
            if (typeof this.hass.states[a[this.sortBy]] === 'undefined') return 0;
            if (this.hass.states[a[this.sortBy]].state === 'unknown' || this.hass.states[a[this.sortBy]].state === 'unavailable') {
                return 1;
            }

            if (typeof this.hass.states[b[this.sortBy]] === 'undefined') return 0;
            if (this.hass.states[b[this.sortBy]].state === 'unknown' || this.hass.states[b[this.sortBy]].state === 'unavailable') {
                return -1;
            }

            if (this.hass.states[a[this.sortBy]].state > this.hass.states[b[this.sortBy]].state) return 1;
            if (this.hass.states[b[this.sortBy]].state > this.hass.states[a[this.sortBy]].state) return -1;

            return 0;
        });

        let header = '';
        if (this.show_header === true) {
            header = this.config.name || 'Tankerkönig';
        }

        return html`<ha-card elevation="2" header="${header}">
            <div class="container">
                <table width="100%">
                    <thead>
                        <tr>
                            <th class="thead-icon"></th>
                            <th class="thead-station"></th>
                            ${this.renderSortingHeader(this.sortBy, 'e5')}
                            ${this.renderSortingHeader(this.sortBy, 'e10')}
                            ${this.renderSortingHeader(this.sortBy, 'diesel')}
                        </tr>
                    </thead>
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

    renderSortingHeader(sortingKey, type) {
        // skip if not configured
        if (!this.has[type]) {
            return;
        }
        return html`<th><div class="badge no-icon ${(sortingKey === type) ? 'active' : ''}"><span class="info"><span class="content" @click="${() => this.render(type)}">${type.toUpperCase()}</span></span></div></th>`;
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

        if (typeof this.config.show !== 'undefined') {
            // set gas types visibility by configuration
            this.has = {
                e5: this.config.show.indexOf('e5') !== -1,
                e10: this.config.show.indexOf('e10') !== -1,
                diesel: this.config.show.indexOf('diesel') !== -1,
            };
        } else {
            // set gas types visibility by default to all
            this.has = {
                e5: true,
                e10: true,
                diesel: true,
            };
        }

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
            return html`${gasPrice.substring(0, gasPrice.length - 1)}<sup>${gasPrice.substring(gasPrice.length - 1, gasPrice.length)}</sup>&euro;`;
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
            .label-badge { border: none; background: none; height: 0; }
            .label-badge .value { display: none; }
            .label-badge .label { bottom: 0; left: 0; right: 0; }
            .label-badge .label { background: var(--disabled-text-color); color: white; }
            .active .label-badge .label { background: var(--primary-color); color: white; }
        `;
    }
}

customElements.define('tankerkoenig-card', TankerkoenigCard);
