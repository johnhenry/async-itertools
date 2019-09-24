import React from 'react';
import ReactDOM from 'react';
import { transduceAsync, transducers, run } from '../dist/esm/index.js';

const target = document.getElementById('target');
const objectIntoProps = (object) => props => ({ ...props, ...object });
const toElement = component => props => React.createElement(component, props);
const renderToDOM = (target) => (element) => ReactDOM.render(element, target);

const genericProgram = async function* (channel) { };
const genericComponent = ({ name }) => React.createElement('div', null, `name: ${name}`);

const { map } = transducers;
const channel = new AsyncChannel();
const program = transduceAsync(
    map(objectIntoProps({ channel })),
    map(toElement(genericComponent)))(
        genericProgram(channel)
);

render(program, renderToDOM(target));
