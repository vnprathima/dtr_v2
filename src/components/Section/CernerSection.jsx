import React, { Component } from 'react';
import SectionHeader from 'terra-section-header';
import Field from 'terra-form-field';
import DynamicGrid from 'terra-dynamic-grid';

export default class CernerSection extends Component {
    constructor(props) {
        super(props);
        this.state = {
            containedResources: null,
            items: null,
            components: [],
            len: []
        };
    }

    componentDidMount() {
        // setup
        const len = this.getComponents(this.props);
        this.setState({ len });
        this.props.updateCallback(this.props.item.linkId, { level: this.props.level, text: this.props.item.text, values: len }, "sectionLinks");
    }

    componentWillReceiveProps(props) {
        const len = this.getComponents(props);
        this.setState({ len });

        let areEqual = len.length === this.state.len.length && len.every(item => this.state.len.indexOf(item) > -1);
        if (!areEqual) {
            props.updateCallback(props.item.linkId, { level: props.level, text: props.item.text, values: len }, "sectionLinks");

        }

    }

    getComponents(props) {
        const newArray = [];
        const linkArray = []
        props.item.item.map((_item) => {
            const component = props.componentRenderer(_item, props.level + 1);
            if (component) {
                newArray.push({ component, _item });
                linkArray.push(_item.linkId)
            }
        });
        this.setState({ components: newArray });
        return linkArray;
    }

    render() {
        const template = {
            'grid-template-columns': '1fr 1fr',
            'grid-template-rows': 'auto',
            'grid-gap': '10px',
        };
        const region1 = {
            'grid-column-start': 1,
            'grid-row-start': 1,
        };
        const region2 = {
            'grid-column-start': 2,
            'grid-row-start': 1,
        };
        return (
            <div className={this.state.components.length === 0 ? "disabled" : ""}>
                <SectionHeader
                    title={this.props.item.text}
                    level={3}
                />
                {this.state.components.map((obj) => {
                    const component = obj.component;
                    const _item = obj._item;
                    return component ? _item.type !== "group" ? (
                        <DynamicGrid defaultTemplate={template} key={_item.linkId}>
                            <DynamicGrid.Region defaultPosition={region1}>
                                <Field htmlFor={_item.linkId} label={_item.text} required={_item.required}></Field>
                            </DynamicGrid.Region>
                            <DynamicGrid.Region defaultPosition={region2}>
                                {component}
                            </DynamicGrid.Region>
                        </DynamicGrid>
                        // <div className="row" key={_item.linkId}>
                        //     <div className={"entry-block col-5 " + (_item.readOnly ? "read-only" : "")}>
                        //         <p className="header-input">
                        //             <span
                        //                 className="info-block"
                        //                 style={
                        //                     // Moves the label off to the side so its aligned on the right
                        //                     { marginLeft: -_item.linkId.length * 7 - 9 }
                        //                 }
                        //             >
                        //                 {_item.linkId}&nbsp;
                        //     </span>
                        //             {_item.text}
                        //             {_item.required ? <span className="required-asterisk">&nbsp;*</span> : null}
                        //             {_item.repeats ? <span className="glyph">&#8634;</span> : null}
                        //         </p>

                        //     </div>
                        //     <div className="col-7">
                        //         {component}
                        //     </div>


                        // </div>

                    ) : <div key={_item.linkId}>{component}</div> : null
                })}
                <br />
            </div>
        );
    }
}
