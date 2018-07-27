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
import td from 'testdouble';
import {verifyDefaultAdapter} from '../helpers/foundation';
import {setupFoundationTest} from '../helpers/setup';
import {createMockRaf} from '../helpers/raf';
import lolex from 'lolex';
import {MDCMenuFoundation} from '../../../packages/mdc-menu/foundation';
import {cssClasses, strings} from '../../../packages/mdc-menu/constants';
import {numbers} from '../../../packages/mdc-menu-surface/constants';

function setupTest() {
  const {foundation, mockAdapter} = setupFoundationTest(MDCMenuFoundation);
  const mockRaf = createMockRaf();
  return {foundation, mockAdapter, mockRaf};
}

suite('MDCMenuFoundation');

test('defaultAdapter returns a complete adapter implementation', () => {
  verifyDefaultAdapter(MDCMenuFoundation, [
    'addClassToElementAtIndex', 'removeClassFromElementAtIndex', 'addAttributeToElementAtIndex',
    'removeAttributeFromElementAtIndex', 'elementContainsClass', 'closeSurface', 'getElementIndex', 'getParentElement',
    'getSelectedElementIndex', 'notifySelected', 'toggleCheckbox',
  ]);
});

test('exports strings', () => {
  assert.deepEqual(MDCMenuFoundation.strings, strings);
});

test('exports cssClasses', () => {
  assert.deepEqual(MDCMenuFoundation.cssClasses, cssClasses);
});

test('destroy does not throw error', () => {
  const {foundation} = setupTest();
  assert.doesNotThrow(() => foundation.destroy());
});

test('destroy does not throw error if destroyed immediately after keydown', () => {
  const {foundation, mockAdapter} = setupTest();
  const key = {key: 'Space', target: 'My Element', preventDefault: td.func('preventDefault')};
  td.when(mockAdapter.elementContainsClass(key.target, cssClasses.LIST_ITEM_CLASS)).thenReturn(true);
  td.when(mockAdapter.getElementIndex(key.target)).thenReturn(0);
  foundation.handleKeydown(key);

  assert.doesNotThrow(() => foundation.destroy());
});

test('destroy closes surface', () => {
  const {foundation, mockAdapter} = setupTest();

  assert.doesNotThrow(() => foundation.destroy());
  td.verify(mockAdapter.closeSurface(), {times: 1});
});

test('handleKeydown does nothing if key is not space, enter, or tab', () => {
  const {foundation, mockAdapter} = setupTest();
  const key = {key: 'N'};

  foundation.handleKeydown(key);
  td.verify(mockAdapter.closeSurface(), {times: 0});
  td.verify(mockAdapter.elementContainsClass(td.matchers.anything()), {times: 0});
});

test('handleKeydown tab key causes the menu to close', () => {
  const {foundation, mockAdapter} = setupTest();
  const key = {key: 'Tab'};

  foundation.handleKeydown(key);
  td.verify(mockAdapter.closeSurface(), {times: 1});
  td.verify(mockAdapter.elementContainsClass(td.matchers.anything()), {times: 0});
});

test('handleKeydown space/enter key causes the menu to close', () => {
  const {foundation, mockAdapter} = setupTest();
  const key = {key: 'Space', target: 'My Element', preventDefault: td.func('preventDefault')};
  td.when(mockAdapter.elementContainsClass(key.target, cssClasses.LIST_ITEM_CLASS)).thenReturn(true);
  td.when(mockAdapter.getElementIndex(key.target)).thenReturn(0);

  foundation.handleKeydown(key);

  td.verify(mockAdapter.closeSurface(), {times: 1});
});

test('handleKeydown space/enter key causes the menu to emit the selected item', () => {
  const {foundation, mockAdapter} = setupTest();
  const key = {key: 'Space', target: 'My Element', preventDefault: td.func('preventDefault')};
  td.when(mockAdapter.elementContainsClass(key.target, cssClasses.LIST_ITEM_CLASS)).thenReturn(true);
  td.when(mockAdapter.getElementIndex(key.target)).thenReturn(0);

  foundation.handleKeydown(key);

  td.verify(mockAdapter.notifySelected({index: 0}), {times: 1});
});

test('handleKeydown space/enter key inside an input does not prevent default on the event', () => {
  const {foundation, mockAdapter} = setupTest();
  const key = {key: 'Space', target: {tagName: 'input'}, preventDefault: td.func('preventDefault')};
  td.when(mockAdapter.elementContainsClass(key.target, cssClasses.LIST_ITEM_CLASS)).thenReturn(true);
  td.when(mockAdapter.getElementIndex(key.target)).thenReturn(0);

  foundation.handleKeydown(key);

  td.verify(key.preventDefault(), {times: 0});
});

test('handleKeydown space/enter key inside a list item causes the preventDefault to be called', () => {
  const {foundation, mockAdapter} = setupTest();
  const key = {key: 'Space', target: {tagName: 'li'}, preventDefault: td.func('preventDefault')};
  td.when(mockAdapter.elementContainsClass(key.target, cssClasses.LIST_ITEM_CLASS)).thenReturn(true);
  td.when(mockAdapter.getElementIndex(key.target)).thenReturn(0);

  foundation.handleKeydown(key);

  td.verify(key.preventDefault(), {times: 1});
});

test('handleKeydown space/enter key not inside of a list item does nothing', () => {
  const {foundation, mockAdapter} = setupTest();
  const key = {key: 'Space', target: {tagName: 'li'}, preventDefault: td.func('preventDefault')};
  td.when(mockAdapter.elementContainsClass(key.target, cssClasses.LIST_ITEM_CLASS)).thenReturn(false);
  td.when(mockAdapter.getParentElement(key.target)).thenReturn(null);
  td.when(mockAdapter.getElementIndex(key.target)).thenReturn(0);

  foundation.handleKeydown(key);

  td.verify(mockAdapter.notifySelected(td.matchers.anything()), {times: 0});
});

test('handleKeydown space/enter key not inside of a child of a list item causes the list item to be selected', () => {
  const {foundation, mockAdapter} = setupTest();
  const key = {key: 'Space', target: {tagName: 'li'}, preventDefault: td.func('preventDefault')};
  td.when(mockAdapter.elementContainsClass(key.target, cssClasses.LIST_ITEM_CLASS)).thenReturn(false, false);
  td.when(mockAdapter.getParentElement(key.target)).thenReturn(key.target, null);
  td.when(mockAdapter.getElementIndex(key.target)).thenReturn(-1);

  foundation.handleKeydown(key);

  td.verify(mockAdapter.notifySelected(td.matchers.anything()), {times: 0});
});

test('handleKeydown space/enter key inside of a child of a list item causes the list item to be selected', () => {
  const {foundation, mockAdapter} = setupTest();
  const key = {key: 'Space', target: {tagName: 'li'}, preventDefault: td.func('preventDefault')};
  td.when(mockAdapter.elementContainsClass(key.target, cssClasses.LIST_ITEM_CLASS)).thenReturn(false, true);
  td.when(mockAdapter.getParentElement(key.target)).thenReturn(key.target);
  td.when(mockAdapter.getElementIndex(key.target)).thenReturn(0);

  foundation.handleKeydown(key);

  td.verify(mockAdapter.notifySelected({index: 0}), {times: 1});
});

test('handleKeydown space/enter key inside of a list item not inside of the menu', () => {
  const {foundation, mockAdapter} = setupTest();
  const key = {key: 'Space', target: {tagName: 'li'}, preventDefault: td.func('preventDefault')};
  td.when(mockAdapter.elementContainsClass(key.target, cssClasses.LIST_ITEM_CLASS)).thenReturn(true);
  td.when(mockAdapter.getElementIndex(key.target)).thenReturn(-1);

  foundation.handleKeydown(key);

  td.verify(mockAdapter.notifySelected(td.matchers.anything()), {times: 0});
});

test('handleKeydown space/enter key inside of a selection group with another element selected', () => {
  const {foundation, mockAdapter} = setupTest();
  const clock = lolex.install();
  const key = {key: 'Space', target: {tagName: 'li'}, preventDefault: td.func('preventDefault')};
  td.when(mockAdapter.elementContainsClass(key.target, cssClasses.LIST_ITEM_CLASS)).thenReturn(true);
  td.when(mockAdapter.getElementIndex(key.target)).thenReturn(0);
  td.when(mockAdapter.getParentElement(key.target)).thenReturn(key.target);
  td.when(mockAdapter.elementContainsClass(key.target, cssClasses.MENU_SELECTION_GROUP)).thenReturn(true);
  td.when(mockAdapter.getSelectedElementIndex(key.target)).thenReturn(0);

  foundation.handleKeydown(key);
  clock.tick(numbers.TRANSITION_CLOSE_DURATION);

  td.verify(mockAdapter.removeClassFromElementAtIndex(0, cssClasses.MENU_SELECTED_LIST_ITEM), {times: 1});
  td.verify(mockAdapter.addClassToElementAtIndex(0, cssClasses.MENU_SELECTED_LIST_ITEM), {times: 1});
  clock.uninstall();
});

test('handleKeydown space/enter key inside of a selection group with no element selected', () => {
  const {foundation, mockAdapter} = setupTest();
  const clock = lolex.install();
  const key = {key: 'Space', target: {tagName: 'li'}, preventDefault: td.func('preventDefault')};
  td.when(mockAdapter.elementContainsClass(key.target, cssClasses.LIST_ITEM_CLASS)).thenReturn(true);
  td.when(mockAdapter.getElementIndex(key.target)).thenReturn(0);
  td.when(mockAdapter.getParentElement(key.target)).thenReturn(key.target);
  td.when(mockAdapter.elementContainsClass(key.target, cssClasses.MENU_SELECTION_GROUP)).thenReturn(true);
  td.when(mockAdapter.getSelectedElementIndex(key.target)).thenReturn(-1);

  foundation.handleKeydown(key);
  clock.tick(numbers.TRANSITION_CLOSE_DURATION);

  td.verify(mockAdapter.removeClassFromElementAtIndex(0, cssClasses.MENU_SELECTED_LIST_ITEM), {times: 0});
  td.verify(mockAdapter.addClassToElementAtIndex(0, cssClasses.MENU_SELECTED_LIST_ITEM), {times: 1});
  clock.uninstall();
});

test('handleKeydown space/enter key inside of a child element of a list item in a selection group with no ' +
  'element selected', () => {
  const {foundation, mockAdapter} = setupTest();
  const clock = lolex.install();
  const key = {key: 'Space', target: {tagName: 'li'}, preventDefault: td.func('preventDefault')};
  td.when(mockAdapter.elementContainsClass(key.target, cssClasses.LIST_ITEM_CLASS)).thenReturn(true);
  td.when(mockAdapter.getElementIndex(key.target)).thenReturn(0);
  td.when(mockAdapter.getParentElement(key.target)).thenReturn(key.target);
  td.when(mockAdapter.elementContainsClass(key.target, cssClasses.MENU_SELECTION_GROUP)).thenReturn(false, true);
  td.when(mockAdapter.getSelectedElementIndex(key.target)).thenReturn(-1);

  foundation.handleKeydown(key);
  clock.tick(numbers.TRANSITION_CLOSE_DURATION);

  td.verify(mockAdapter.removeClassFromElementAtIndex(0, cssClasses.MENU_SELECTED_LIST_ITEM), {times: 0});
  td.verify(mockAdapter.addClassToElementAtIndex(0, cssClasses.MENU_SELECTED_LIST_ITEM), {times: 1});
  clock.uninstall();
});

test('handleKeydown space/enter key inside of a child element of a selection group (but not a list item) with no ' +
  'element selected', () => {
  const {foundation, mockAdapter} = setupTest();
  const clock = lolex.install();
  const key = {key: 'Space', target: {tagName: 'li'}, preventDefault: td.func('preventDefault')};
  td.when(mockAdapter.elementContainsClass(key.target, cssClasses.LIST_ITEM_CLASS)).thenReturn(true);
  td.when(mockAdapter.getElementIndex(key.target)).thenReturn(0);
  td.when(mockAdapter.getParentElement(key.target)).thenReturn(key.target);
  td.when(mockAdapter.elementContainsClass(key.target, cssClasses.MENU_SELECTION_GROUP)).thenReturn(false);
  td.when(mockAdapter.elementContainsClass(key.target, cssClasses.LIST_CLASS)).thenReturn(false, true);
  td.when(mockAdapter.getSelectedElementIndex(key.target)).thenReturn(-1);

  foundation.handleKeydown(key);
  clock.tick(numbers.TRANSITION_CLOSE_DURATION);

  td.verify(mockAdapter.removeClassFromElementAtIndex(0, cssClasses.MENU_SELECTED_LIST_ITEM), {times: 0});
  td.verify(mockAdapter.addClassToElementAtIndex(0, cssClasses.MENU_SELECTED_LIST_ITEM), {times: 0});
  clock.uninstall();
});

// Clicks

test('handleClick space/enter key causes the menu to close', () => {
  const {foundation, mockAdapter} = setupTest();
  const key = {key: 'Space', target: 'My Element', preventDefault: td.func('preventDefault')};
  td.when(mockAdapter.elementContainsClass(key.target, cssClasses.LIST_ITEM_CLASS)).thenReturn(true);
  td.when(mockAdapter.getElementIndex(key.target)).thenReturn(0);

  foundation.handleClick(key);

  td.verify(mockAdapter.closeSurface(), {times: 1});
});

test('handleClick space/enter key causes the menu to emit the selected item', () => {
  const {foundation, mockAdapter} = setupTest();
  const key = {key: 'Space', target: 'My Element', preventDefault: td.func('preventDefault')};
  td.when(mockAdapter.elementContainsClass(key.target, cssClasses.LIST_ITEM_CLASS)).thenReturn(true);
  td.when(mockAdapter.getElementIndex(key.target)).thenReturn(0);

  foundation.handleClick(key);

  td.verify(mockAdapter.notifySelected({index: 0}), {times: 1});
});

test('handleClick space/enter key inside an input does not prevent default on the event', () => {
  const {foundation, mockAdapter} = setupTest();
  const key = {key: 'Space', target: {tagName: 'input'}, preventDefault: td.func('preventDefault')};
  td.when(mockAdapter.elementContainsClass(key.target, cssClasses.LIST_ITEM_CLASS)).thenReturn(true);
  td.when(mockAdapter.getElementIndex(key.target)).thenReturn(0);

  foundation.handleClick(key);

  td.verify(key.preventDefault(), {times: 0});
});

test('handleClick space/enter key inside a list item causes the preventDefault to be called', () => {
  const {foundation, mockAdapter} = setupTest();
  const key = {key: 'Space', target: {tagName: 'li'}, preventDefault: td.func('preventDefault')};
  td.when(mockAdapter.elementContainsClass(key.target, cssClasses.LIST_ITEM_CLASS)).thenReturn(true);
  td.when(mockAdapter.getElementIndex(key.target)).thenReturn(0);

  foundation.handleClick(key);

  td.verify(key.preventDefault(), {times: 1});
});

test('handleClick space/enter key not inside of a list item does nothing', () => {
  const {foundation, mockAdapter} = setupTest();
  const key = {key: 'Space', target: {tagName: 'li'}, preventDefault: td.func('preventDefault')};
  td.when(mockAdapter.elementContainsClass(key.target, cssClasses.LIST_ITEM_CLASS)).thenReturn(false);
  td.when(mockAdapter.getParentElement(key.target)).thenReturn(null);
  td.when(mockAdapter.getElementIndex(key.target)).thenReturn(0);

  foundation.handleClick(key);

  td.verify(mockAdapter.notifySelected(td.matchers.anything()), {times: 0});
});

test('handleClick space/enter key not inside of a child of a list item causes the list item to be selected', () => {
  const {foundation, mockAdapter} = setupTest();
  const key = {key: 'Space', target: {tagName: 'li'}, preventDefault: td.func('preventDefault')};
  td.when(mockAdapter.elementContainsClass(key.target, cssClasses.LIST_ITEM_CLASS)).thenReturn(false, false);
  td.when(mockAdapter.getParentElement(key.target)).thenReturn(key.target, null);
  td.when(mockAdapter.getElementIndex(key.target)).thenReturn(-1);

  foundation.handleClick(key);

  td.verify(mockAdapter.notifySelected(td.matchers.anything()), {times: 0});
});

test('handleClick space/enter key inside of a child of a list item causes the list item to be selected', () => {
  const {foundation, mockAdapter} = setupTest();
  const key = {key: 'Space', target: {tagName: 'li'}, preventDefault: td.func('preventDefault')};
  td.when(mockAdapter.elementContainsClass(key.target, cssClasses.LIST_ITEM_CLASS)).thenReturn(false, true);
  td.when(mockAdapter.getParentElement(key.target)).thenReturn(key.target);
  td.when(mockAdapter.getElementIndex(key.target)).thenReturn(0);

  foundation.handleClick(key);

  td.verify(mockAdapter.notifySelected({index: 0}), {times: 1});
});

test('handleClick space/enter key inside of a list item not inside of the menu', () => {
  const {foundation, mockAdapter} = setupTest();
  const key = {key: 'Space', target: {tagName: 'li'}, preventDefault: td.func('preventDefault')};
  td.when(mockAdapter.elementContainsClass(key.target, cssClasses.LIST_ITEM_CLASS)).thenReturn(true);
  td.when(mockAdapter.getElementIndex(key.target)).thenReturn(-1);

  foundation.handleClick(key);

  td.verify(mockAdapter.notifySelected(td.matchers.anything()), {times: 0});
});

test('handleClick space/enter key inside of a selection group with another element selected', () => {
  const {foundation, mockAdapter} = setupTest();
  const clock = lolex.install();
  const key = {key: 'Space', target: {tagName: 'li'}, preventDefault: td.func('preventDefault')};
  td.when(mockAdapter.elementContainsClass(key.target, cssClasses.LIST_ITEM_CLASS)).thenReturn(true);
  td.when(mockAdapter.getElementIndex(key.target)).thenReturn(0);
  td.when(mockAdapter.getParentElement(key.target)).thenReturn(key.target);
  td.when(mockAdapter.elementContainsClass(key.target, cssClasses.MENU_SELECTION_GROUP)).thenReturn(true);
  td.when(mockAdapter.getSelectedElementIndex(key.target)).thenReturn(0);

  foundation.handleClick(key);
  clock.tick(numbers.TRANSITION_CLOSE_DURATION);

  td.verify(mockAdapter.removeClassFromElementAtIndex(0, cssClasses.MENU_SELECTED_LIST_ITEM), {times: 1});
  td.verify(mockAdapter.addClassToElementAtIndex(0, cssClasses.MENU_SELECTED_LIST_ITEM), {times: 1});
  clock.uninstall();
});

test('handleClick space/enter key inside of a selection group with no element selected', () => {
  const {foundation, mockAdapter} = setupTest();
  const clock = lolex.install();
  const key = {key: 'Space', target: {tagName: 'li'}, preventDefault: td.func('preventDefault')};
  td.when(mockAdapter.elementContainsClass(key.target, cssClasses.LIST_ITEM_CLASS)).thenReturn(true);
  td.when(mockAdapter.getElementIndex(key.target)).thenReturn(0);
  td.when(mockAdapter.getParentElement(key.target)).thenReturn(key.target);
  td.when(mockAdapter.elementContainsClass(key.target, cssClasses.MENU_SELECTION_GROUP)).thenReturn(true);
  td.when(mockAdapter.getSelectedElementIndex(key.target)).thenReturn(-1);

  foundation.handleClick(key);
  clock.tick(numbers.TRANSITION_CLOSE_DURATION);

  td.verify(mockAdapter.removeClassFromElementAtIndex(0, cssClasses.MENU_SELECTED_LIST_ITEM), {times: 0});
  td.verify(mockAdapter.addClassToElementAtIndex(0, cssClasses.MENU_SELECTED_LIST_ITEM), {times: 1});
  clock.uninstall();
});

test('handleClick space/enter key inside of a child element of a list item in a selection group with no ' +
  'element selected', () => {
  const {foundation, mockAdapter} = setupTest();
  const clock = lolex.install();
  const key = {key: 'Space', target: {tagName: 'li'}, preventDefault: td.func('preventDefault')};
  td.when(mockAdapter.elementContainsClass(key.target, cssClasses.LIST_ITEM_CLASS)).thenReturn(true);
  td.when(mockAdapter.getElementIndex(key.target)).thenReturn(0);
  td.when(mockAdapter.getParentElement(key.target)).thenReturn(key.target);
  td.when(mockAdapter.elementContainsClass(key.target, cssClasses.MENU_SELECTION_GROUP)).thenReturn(false, true);
  td.when(mockAdapter.getSelectedElementIndex(key.target)).thenReturn(-1);

  foundation.handleClick(key);
  clock.tick(numbers.TRANSITION_CLOSE_DURATION);

  td.verify(mockAdapter.removeClassFromElementAtIndex(0, cssClasses.MENU_SELECTED_LIST_ITEM), {times: 0});
  td.verify(mockAdapter.addClassToElementAtIndex(0, cssClasses.MENU_SELECTED_LIST_ITEM), {times: 1});
  clock.uninstall();
});

test('handleClick space/enter key inside of a child element of a selection group (but not a list item) with no ' +
  'element selected', () => {
  const {foundation, mockAdapter} = setupTest();
  const clock = lolex.install();
  const key = {key: 'Space', target: {tagName: 'li'}, preventDefault: td.func('preventDefault')};
  td.when(mockAdapter.elementContainsClass(key.target, cssClasses.LIST_ITEM_CLASS)).thenReturn(true);
  td.when(mockAdapter.getElementIndex(key.target)).thenReturn(0);
  td.when(mockAdapter.getParentElement(key.target)).thenReturn(key.target);
  td.when(mockAdapter.elementContainsClass(key.target, cssClasses.MENU_SELECTION_GROUP)).thenReturn(false);
  td.when(mockAdapter.elementContainsClass(key.target, cssClasses.LIST_CLASS)).thenReturn(false, true);
  td.when(mockAdapter.getSelectedElementIndex(key.target)).thenReturn(-1);

  foundation.handleClick(key);
  clock.tick(numbers.TRANSITION_CLOSE_DURATION);

  td.verify(mockAdapter.removeClassFromElementAtIndex(0, cssClasses.MENU_SELECTED_LIST_ITEM), {times: 0});
  td.verify(mockAdapter.addClassToElementAtIndex(0, cssClasses.MENU_SELECTED_LIST_ITEM), {times: 0});
  clock.uninstall();
});
