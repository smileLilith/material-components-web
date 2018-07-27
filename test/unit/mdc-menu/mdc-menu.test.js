/**
 * Copyright 2016 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {assert} from 'chai';
import bel from 'bel';
import td from 'testdouble';
import domEvents from 'dom-events';

import {MDCMenu, MDCMenuFoundation} from '../../../packages/mdc-menu/index';
import {Corner} from '../../../packages/mdc-menu-surface/constants';
import {MDCListFoundation} from '../../../packages/mdc-list';

function getFixture(open) {
  return bel`
    <div class="mdc-menu-surface ${open ? 'mdc-menu-surface--open' : ''}" tabindex="-1">
      <ul class="mdc-list" role="menu">
        <li tabIndex="-1" class="mdc-list-item" role="menuitem">Item</a>
        <li role="separator"></li>
        <li tabIndex="-1" class="mdc-list-item" role="menuitem">Another Item</a>
        <ul class="mdc-menu__selection-group mdc-list" role="menu">
          <li tabIndex="-1" class="mdc-list-item" role="menuitem">Item</a>
          <li tabIndex="-1" class="mdc-list-item mdc-menu-item--selected" role="menuitem">Another Item</a>
        </ul>
      </ul>
    </div>
  `;
}

class FakeList {
  constructor(root) {
    this.root = root;
    this.destroy = td.func('.destroy');
    this.itemsContainer = td.func('.root_');
    this.listElements_ = [].slice.call(root.querySelectorAll('.mdc-list-item'));
  }
}

class FakeMenuSurface {
  constructor(root) {
    this.root = root;
    this.destroy = td.func('.destroy');
    this.open = false;
    this.show = td.func('.show');
    this.hide = td.func('.hide');
    this.listen = td.function();
    this.setAnchorCorner = td.func('.setAnchorCorner');
    this.setAnchorMargin = td.func('.setAnchorMargin');
    this.quickOpen = false;
    this.setFixedPosition = td.func('.setFixedPosition');
    this.hoistMenuToBody = td.func('.hoistMenuToBody');
    this.setIsHoisted = td.func('.setIsHoisted');
    this.anchorElement = null;

    td.when(this.listen(td.matchers.anything(), td.callback())).thenCallback();
  }
}

function setupTestWithFakes(open = false) {
  const root = getFixture(open);

  const menuSurface = new FakeMenuSurface(root);
  menuSurface.open = open;

  const MockFoundationCtor = td.constructor(MDCListFoundation);
  const mockFoundation = new MockFoundationCtor();

  const list = new FakeList(root.querySelector('.mdc-list'));
  const component = new MDCMenu(root, mockFoundation, () => menuSurface, () => list);
  return {root, component, menuSurface, list, mockFoundation};
}

function setupTest(open = false) {
  const root = getFixture(open);

  const component = new MDCMenu(root);
  return {root, component};
}

suite('MDCMenu');

test('destroy causes the menu-surface and list to be destroyed', () => {
  const {component, list, menuSurface} = setupTestWithFakes();
  component.destroy();
  td.verify(list.destroy());
  td.verify(menuSurface.destroy());
});

test('destroy does throw an error if the list is not instantiated', () => {
  const fixture = getFixture();
  const list = fixture.querySelector('.mdc-list');
  list.parentElement.removeChild(list);
  const component = new MDCMenu(fixture);

  assert.doesNotThrow(component.destroy.bind(component));
});

test('attachTo initializes and returns a MDCMenu instance', () => {
  assert.isTrue(MDCMenu.attachTo(getFixture()) instanceof MDCMenu);
});

test('get/set open', () => {
  const {component, menuSurface} = setupTestWithFakes();

  assert.isFalse(component.open);

  component.open = true;
  td.verify(menuSurface.show());

  component.open = false;
  td.verify(menuSurface.hide());
});

test('show opens the menu', () => {
  const {component, menuSurface} = setupTestWithFakes();
  component.show();
  td.verify(menuSurface.show());
});

test('hide closes the menu', () => {
  const {component, menuSurface} = setupTestWithFakes();
  component.open = true;
  component.hide();
  td.verify(menuSurface.hide());
});

test('setAnchorCorner proxies to the MDCMenuSurface#setAnchorCorner method', () => {
  const {component, menuSurface} = setupTestWithFakes();
  component.setAnchorCorner(Corner.TOP_START);
  td.verify(menuSurface.setAnchorCorner(Corner.TOP_START));
});

test('setAnchorMargin', () => {
  const {component, menuSurface} = setupTestWithFakes();
  component.setAnchorMargin({top: 0, right: 0, bottom: 0, left: 0});
  td.verify(menuSurface.setAnchorMargin({top: 0, right: 0, bottom: 0, left: 0}));
});

test('setQuickOpen', () => {
  const {component, menuSurface} = setupTestWithFakes();
  component.quickOpen = true;
  assert.isTrue(menuSurface.quickOpen);
});

test('items returns all menu items', () => {
  const {root, component, list} = setupTestWithFakes();
  const items = [].slice.call(root.querySelectorAll('[role="menuitem"]'));
  list.listElements_ = items;
  assert.deepEqual(component.items, items);
});

test('items returns nothing if list is not defined', () => {
  const {root, component, list} = setupTestWithFakes();
  const items = [].slice.call(root.querySelectorAll('[role="menuitem"]'));
  list.listElements_ = items;
  assert.deepEqual(component.items, items);
});

test('getOptionByIndex', () => {
  const {root, component, list} = setupTestWithFakes();
  const items = [].slice.call(root.querySelectorAll('[role="menuitem"]'));
  list.listElements_ = items;
  assert.deepEqual(component.getOptionByIndex(0), items[0]);
});

test('getOptionByIndex returns null if index is > list length', () => {
  const {root, component, list} = setupTestWithFakes();
  const items = [].slice.call(root.querySelectorAll('[role="menuitem"]'));
  list.listElements_ = items;
  assert.equal(component.getOptionByIndex(items.length), null);
});

test('fixed', () => {
  const {component, menuSurface} = setupTestWithFakes();
  component.fixed = true;
  td.verify(menuSurface.setFixedPosition(true));

  component.fixed = false;
  td.verify(menuSurface.setFixedPosition(false));
});

test('hoistMenuToBody', () => {
  const {component, menuSurface} = setupTestWithFakes();
  component.hoistMenuToBody();
  td.verify(menuSurface.hoistMenuToBody());
});

test('setIsHoisted', () => {
  const {component, menuSurface} = setupTestWithFakes();
  component.setIsHoisted(true);
  td.verify(menuSurface.setIsHoisted(true));

  component.setIsHoisted(false);
  td.verify(menuSurface.setIsHoisted(false));
});

test('setAnchorElement', () => {
  const {component, menuSurface} = setupTestWithFakes();
  const button = document.createElement('button');
  component.setAnchorElement(button);
  assert.equal(menuSurface.anchorElement, button);
});

test('show registers event listener for keydown', () => {
  const {component, mockFoundation, root} = setupTestWithFakes();
  component.show();

  domEvents.emit(root, 'keydown');
  td.verify(mockFoundation.handleKeydown(td.matchers.anything()), {times: 1});
});

test('show registers event listener for click', () => {
  const {component, mockFoundation, root} = setupTestWithFakes();
  component.show();

  domEvents.emit(root, 'click');
  td.verify(mockFoundation.handleClick(td.matchers.anything()), {times: 1});
});

test('hide de-registers event listener for keydown', () => {
  const {component, mockFoundation, root} = setupTestWithFakes();
  component.show();
  component.hide();

  domEvents.emit(root, 'keydown');
  td.verify(mockFoundation.handleKeydown(td.matchers.anything()), {times: 0});
});

test('show de-registers event listener for click', () => {
  const {component, mockFoundation, root} = setupTestWithFakes();
  component.show();
  component.hide();

  domEvents.emit(root, 'click');
  td.verify(mockFoundation.handleClick(td.matchers.anything()), {times: 0});
});

test('show causes first element to be focused', () => {
  const {component, root} = setupTestWithFakes();
  document.body.appendChild(root);
  component.show();

  assert.equal(document.activeElement, root.querySelector('.mdc-list-item'));
  document.body.removeChild(root);
});

test('show causes does not throw an error if there are no items in the list to focus', () => {
  const {component, root, list} = setupTestWithFakes();
  list.listElements_ = [];
  document.body.appendChild(root);
  root.querySelector('.mdc-list-item');
  assert.doesNotThrow(() => component.show());
  document.body.removeChild(root);
});

// Adapter method tesst

test('adapter#addClassToElementAtIndex adds a class to the element at the index provided', () => {
  const {root, component} = setupTest();
  const firstItem = root.querySelector('.mdc-list-item');
  component.getDefaultFoundation().adapter_.addClassToElementAtIndex(0, 'foo');
  assert.isTrue(firstItem.classList.contains('foo'));
});

test('adapter#addClassToElementAtIndex does not throw an error if index does not exist', () => {
  const {root, component} = setupTest();
  const items = root.querySelectorAll('.mdc-list-item');
  assert.doesNotThrow(() => component.getDefaultFoundation().adapter_.addClassToElementAtIndex(items.length, 'foo'));
});

test('adapter#removeClassFromElementAtIndex adds a class to the element at the index provided', () => {
  const {root, component} = setupTest();
  const firstItem = root.querySelector('.mdc-list-item');
  firstItem.classList.add('foo');
  component.getDefaultFoundation().adapter_.removeClassFromElementAtIndex(0, 'foo');
  assert.isFalse(firstItem.classList.contains('foo'));
});

test('adapter#removeClassFromElementAtIndex does not throw an error if index does not exist', () => {
  const {root, component} = setupTest();
  const items = root.querySelectorAll('.mdc-list-item');
  items[0].classList.add('foo');
  assert.doesNotThrow(() =>
    component.getDefaultFoundation().adapter_.removeClassFromElementAtIndex(items.length, 'foo'));
});

test('adapter#addAttributeToElementAtIndex adds a class to the element at the index provided', () => {
  const {root, component} = setupTest();
  const firstItem = root.querySelector('.mdc-list-item');
  component.getDefaultFoundation().adapter_.addAttributeToElementAtIndex(0, 'foo', 'true');
  assert.isTrue(firstItem.getAttribute('foo') === 'true');
});

test('adapter#addAttributeToElementAtIndex does not throw an error if index does not exist', () => {
  const {root, component} = setupTest();
  const items = root.querySelectorAll('.mdc-list-item');
  assert.doesNotThrow(() =>
    component.getDefaultFoundation().adapter_.addAttributeToElementAtIndex(items.length, 'foo', 'true'));
});

test('adapter#removeAttributeFromElementAtIndex adds a class to the element at the index provided', () => {
  const {root, component} = setupTest();
  const firstItem = root.querySelector('.mdc-list-item');
  firstItem.setAttribute('foo', 'true');
  component.getDefaultFoundation().adapter_.removeAttributeFromElementAtIndex(0, 'foo');
  assert.isNull(firstItem.getAttribute('foo'));
});

test('adapter#removeAttributeFromElementAtIndex does not throw an error if index does not exist', () => {
  const {root, component} = setupTest();
  const items = root.querySelectorAll('.mdc-list-item');
  items[0].setAttribute('foo', 'true');
  assert.doesNotThrow(() =>
    component.getDefaultFoundation().adapter_.removeAttributeFromElementAtIndex(items.length, 'foo'));
});

test('adapter#elementContainsClass returns true if the class exists on the element', () => {
  const {root, component} = setupTest();
  const firstItem = root.querySelector('.mdc-list-item');
  firstItem.classList.add('foo');
  const containsFoo = component.getDefaultFoundation().adapter_.elementContainsClass(firstItem, 'foo');
  assert.isTrue(containsFoo);
});

test('adapter#elementContainsClass returns false if the class does not exist on the element', () => {
  const {root, component} = setupTest();
  const firstItem = root.querySelector('.mdc-list-item');
  const containsFoo = component.getDefaultFoundation().adapter_.elementContainsClass(firstItem, 'foo');
  assert.isFalse(containsFoo);
});

test('adapter#closeSurface returns false if the class does not exist on the element', () => {
  const {component, menuSurface} = setupTestWithFakes();
  component.getDefaultFoundation().adapter_.closeSurface();
  td.verify(menuSurface.hide(), {times: 1});
});

test('adapter#getElementIndex returns the index value of an element in the list', () => {
  const {root, component} = setupTest();
  const firstItem = root.querySelector('.mdc-list-item');
  const indexValue = component.getDefaultFoundation().adapter_.getElementIndex(firstItem);
  assert.equal(0, indexValue);
});

test('adapter#getElementIndex returns -1 if the element does not exist in the list', () => {
  const {component} = setupTest();
  const firstItem = document.createElement('li');
  const indexValue = component.getDefaultFoundation().adapter_.getElementIndex(firstItem);
  assert.equal(-1, indexValue);
});

test('adapter#getParentElement returns the parent element of an element', () => {
  const {root, component} = setupTest();
  const firstItem = root.querySelector('.mdc-list-item');
  const parentElement = component.getDefaultFoundation().adapter_.getParentElement(firstItem);
  assert.equal(firstItem.parentElement, parentElement);
});

test('adapter#getSelectedElementIndex returns the index of the "selected" element in a group', () => {
  const {root, component} = setupTest();
  const selectionGroup = root.querySelector('.mdc-menu__selection-group');
  const index = component.getDefaultFoundation().adapter_.getSelectedElementIndex(selectionGroup);
  assert.equal(root.querySelector('.mdc-menu-item--selected'), component.items[index]);
});

test('adapter#getSelectedElementIndex returns -1 if the "selected" element is not in a group', () => {
  const {root, component} = setupTest();
  const selectionGroup = root.querySelector('.mdc-menu__selection-group');
  const element = root.querySelector('.mdc-menu-item--selected');
  element.classList.remove('mdc-menu-item--selected');
  const index = component.getDefaultFoundation().adapter_.getSelectedElementIndex(selectionGroup);
  assert.equal(-1, index);
});

test('adapter#notifySelected emits an event for a selected element', () => {
  const {root, component} = setupTest();
  const handler = td.func('eventHandler');
  root.addEventListener(MDCMenuFoundation.strings.SELECTED_EVENT, handler);
  component.getDefaultFoundation().adapter_.notifySelected(0);
  td.verify(handler(td.matchers.anything()));
});

test('adapter#toggleCheckbox toggle a checkbox in a list item', () => {
  const {root, component} = setupTest();
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = false;
  const firstItem = root.querySelector('.mdc-list-item');
  firstItem.append(checkbox);

  component.getDefaultFoundation().adapter_.toggleCheckbox(firstItem);
  assert.isTrue(checkbox.checked);
});

test('adapter#toggleCheckbox does not throw an error if a checkbox is not in a list item', () => {
  const {root, component} = setupTest();
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = false;
  const firstItem = root.querySelector('.mdc-list-item');

  assert.doesNotThrow(() => component.getDefaultFoundation().adapter_.toggleCheckbox(firstItem));
  assert.isFalse(checkbox.checked);
});
