
import React, { Component } from 'react';
import axios from 'axios';
import { hot } from "react-hot-loader";

class DisplayBox extends Component {
  constructor(props) {
    super(props);
    this.launchLink = this.launchLink.bind(this);
    this.launchSource = this.launchSource.bind(this);
    this.renderSource = this.renderSource.bind(this);
    this.modifySmartLaunchUrls = this.modifySmartLaunchUrls.bind(this);
    this.retrieveLaunchContext = this.retrieveLaunchContext.bind(this);

    this.state = {
      accessToken: '',
      messageJson: {
        "resourceType": "MessageDefinition",
        "status": "draft",
        "category": { "code": "notification" },
        "focus": [
          {
            "code": "Patient",
            "profile": {
              "reference": "StructureDefinition/example"
            },
            "min": 2,
            "max": "2"
          }
        ]
      }
    };
  }
  /**
   * Take a suggestion from a CDS service based on action on from a card. Also pings the analytics endpoint (if any) of the
   * CDS service to notify that a suggestion was taken
   * @param {*} suggestion - CDS service-defined suggestion to take based on CDS Hooks specification
   * @param {*} url - CDS service endpoint URL
   */

  takeSuggestion(suggestion, url) {
    if (!this.props.isDemoCard) {
      if (suggestion.label) {
        if (suggestion.uuid) {
          axios({
            method: 'POST',
            url: `${url}/analytics/${suggestion.uuid}`,
            data: {},
          });
        }
        console.log("Take suggestion");
        // console.log(suggestion);
        // console.log(this.props);
        this.props.takeSuggestion(suggestion);
      } else {
        console.error('There was no label on this suggestion', suggestion);
      }
    }
  }

  /**
   * Prevent the source link from opening in the same tab
   * @param {*} e - Event emitted when source link is clicked
   */
  launchSource(e) {
    e.preventDefault();
  }

  /**
   * Open the absolute or SMART link in a new tab and display an error if a SMART link does not have
   * appropriate launch context if used against a secured FHIR endpoint.
   * @param {*} e - Event emitted when link is clicked
   * @param {*} link - Link object that contains the URL and any error state to catch
   */
  launchLink(e, link) {
    if (!this.props.isDemoCard) {
      e.preventDefault();
      if (link.error) {
        // TODO: Create an error modal to display for SMART link that cannot be launched securely
        return;
      }
      window.open(link.url, '_blank');
    }
  }

  /**
   * For SMART links, modify the link URLs as this component processes them according to two scenarios:
   * 1 - Secured: Retrieve a launch context for the link and append a launch and iss parameter for use against secured endpoints
   * 2 - Open: Append a fhirServiceUrl and patientId parameter to the link for use against open endpoints
   * @param {*} card - Card object to process the links for
   */
  modifySmartLaunchUrls(card) {
    console.log("Props---", this.props);
    return card.links.map((link) => {
      let linkCopy = Object.assign({}, link);
      console.log("LInkkk obj", link)
      if (link.type === 'smart') {
        // this.retrieveLaunchContext(
        //   linkCopy, this.props.fhirAccessToken,
        //   this.props.patientId, this.props.fhirServerUrl,
        // ).then((result) => {
        //   linkCopy = result;
        //   console.log("Link after retrieve method---", linkCopy);
        //   return linkCopy;
        // });
        this.retrieveLaunchContext(
          linkCopy, this.props.fhirAccessToken,
          this.props.patientId, this.props.fhirServerUrl,
        ).then((result) => {
          linkCopy = result;
          console.log("Link after retrieve method---", linkCopy);
          return linkCopy;
        });
      }
      console.log("final---", linkCopy);
      return linkCopy;
    });
  }

  /**
 * Retrieves a SMART launch context from an endpoint to append as a "launch" query parameter to a SMART app launch URL (see SMART docs for more about launch context).
 * This applies mainly if a SMART app link on a card is to be launched. The link needs a "launch" query param with some opaque value from the SMART server entity.
 * This function generates the launch context (for HSPC Sandboxes only) for a SMART application by pinging a specific endpoint on the FHIR base URL and returns
 * a Promise to resolve the newly modified link.
 * @param {*} link - The SMART app launch URL
 * @param {*} accessToken - The access token provided to the CDS Hooks Sandbox by the FHIR server
 * @param {*} patientId - The identifier of the patient in context
 * @param {*} fhirBaseUrl - The base URL of the FHIR server in context
 */


  retrieveLaunchContext(link, accessToken, patientId, fhirBaseUrl) {
    return new Promise((resolve, reject) => {
      if (link.url.indexOf('?') < 0) {
        link.url += '?';
      } else {
        link.url += '&';
      }

      link.url += `iss=` + this.state.config.provider_fhir_url;
      if (link.appContext) {
        link.url += `&launch=` + link.appContext;
        link.url += `&launchContextId=` + link.appContext;
      }
      link.url += `&client_id=` + this.state.config.provider_client_id;
      //link.url += `client_id=` + this.state.config.provider_client_id;
      console.log("link----", link);
      return resolve(link);
    })
  }
    /**
     * Helper function to build out the UI for the source of the Card
     * @param {*} source - Object as part of the card to build the UI for
     */
    renderSource(source) {
      if (!source.label) { return null; }
      let icon;
      if (source.icon) {
        icon = <img src={source.icon} alt="Could not fetch icon" width="100" height="100" />;
      }
      if (!this.props.isDemoCard) {
        return (
          <p>
            Source: <a href={source.url || '#'} target="_blank">{source.label}</a>
            {icon}
          </p>
        );
      }
      return (
        <p>

          Source:
            <a // eslint-disable-line jsx-a11y/anchor-is-valid
            href={source.url || '#'}
            onClick={e => this.launchSource(e)}
          >
            {source.label}
          </a>

          {icon}
        </p>
      );
    }
    render() {
      const indicators = {
        info: 0,
        warning: 1,
        'hard-stop': 2,
        error: 3,
      };

      const summaryColors = {
        info: '#0079be',
        warning: '#ffae42',
        'hard-stop': '#c00',
        error: '#333',
      };
      const renderedCards = [];
      // Iterate over each card in the cards array
      if (this.props.response != null) {
        console.log("Resspsp", this.props.response.hasOwnProperty('requirements'), this.props.response);
        // var prior_auth = this.props.response.links[0].appContext.prior_auth
        if (this.props.req_type !== "coverage_determination" && (this.props.response.hasOwnProperty('cards')) && this.props.response.cards != null) {
          this.props.response.cards
            .sort((b, a) => indicators[a.indicator] - indicators[b.indicator])
            .forEach((c, cardInd) => {
              const card = JSON.parse(JSON.stringify(c));

              // -- Summary --
              const summarySection = <h3>{card.summary}</h3>;

              // -- Source --
              const sourceSection = card.source && Object.keys(card.source).length ? this.renderSource(card.source) : '';

              // -- Detail (ReactMarkdown supports Github-flavored markdown) --
              const detailSection = '';


              // -- Suggestions --
              let suggestionsSection;
              if (card.suggestions) {
                suggestionsSection = card.suggestions.map((item, ind) => (
                  <button
                    key={ind}
                    onClick={() => this.takeSuggestion(item, card.serviceUrl)}
                    text={item.label}
                  // variant={Button.Opts.Variants.EMPHASIS}
                  />
                ));
              }

              //links section
              let linksSection;
              if (card.links) {
                console.log("Smart launch url --1---", this.modifySmartLaunchUrls(card));
                card.links = this.modifySmartLaunchUrls(card) || card.links;
                console.log("Smart launch url -----", card.links);
                linksSection = card.links.map((link, ind) => (
                  <div key={ind}>
                    <div className="div-prior-auth">
                      <p>Prior Authorization is  necessary </p>
                      {link.hasOwnProperty('appContext') && link.appContext.hasOwnProperty("prior_auth") &&
                        <ul className="prior_auth_ul">
                          {
                            Object.keys(link.appContext.prior_auth).map(function (code, index) {
                              console.log("in prior auth loop--", code);
                              return <li>
                                {link.appContext.prior_auth[code].value == true &&
                                  <p>Prior Authorization necessary for {code}</p>
                                }
                                {link.appContext.prior_auth[code].value == false &&
                                  <p>No Prior Authorization is Needed for {code} </p>
                                }
                              </li>
                            })
                          }
                        </ul>

                      }

                    </div>
                    {/* <a className="cta-btn" target="_blank" href={link.url}>{link.label}</a> */}
                    <button className="smart-btn"
                      onClick={e => this.launchLink(e, link)}
                      text={link.label}
                      variant={Button.Opts.Variants['DE-EMPHASIS']}
                    >{link.label}</button>
                  </div>
                ));
              }

              const builtCard = (
                <section id="call-to-action" className="call-to-action wow fadeIn" key={cardInd}>
                  <div className="container text-center">
                    {summarySection}
                    {sourceSection}
                    {detailSection}
                    <div>
                      {suggestionsSection}
                    </div>
                    <div>
                      {linksSection}
                    </div>
                  </div>
                </section>
              );

              renderedCards.push(builtCard);
            });
        }
      }

      if (renderedCards.length === 0) { return <div><div className='decision-card alert-warning'>No Cards</div></div>; }
      else {
        return <div className="col-8 offset-2" style={{ marginTop: "30px", marginBottom: "50px" }}>{renderedCards}</div>;
      }

    }
  }

function mapStateToProps(state) {
  console.log(state);
  return {
    config: state.config,
  };
};
export default hot(module)(DisplayBox);