/**
 * SalesforceIQ
 * @see  https://github.com/Illumineto/node-salesforceiq
 * Original code from: https://github.com/sjlu/node-relateiq
 * Original code license: MIT
 */

'use strict';

var request = require('request');
var _ = require('lodash');

var SalesforceIQ = (function() {

  var url = 'https://api.salesforceiq.com/v2/';

  function SalesforceIQ(apiKey, apiSecret) {
    request = request.defaults({
      auth: {
        user: apiKey,
        pass: apiSecret,
        sendImmediately: true
      }
    });
  }

  var makeRequest = function(uri, data, cb) {
    /* Set defaults and set the
     * api user and secret key
     * as the request's basic auth
     */
    data = data || {};
    data.method = data.method || 'GET';

    request(url + uri, data, function(err, httpReq, body) {
      if (err) { return cb(err); }

      switch (httpReq.statusCode) {
        case 200:
        case 204: {
          break;
        }
        case 400: {
          // REF console.log('err = ', err);
          // REF console.log('body = ', body);
          console.trace(err, httpReq, body);
          return cb(new Error('bad request'));
        }
        case 401: {
          return cb(new Error('unauthorized'));
        }
        case 403: {
          return cb(new Error('forbidden'));
        }
        case 404: {
          return cb(new Error('not found'));
        }
        case 422: {
          return cb(new Error('unprocessable entity'));
        }
        case 429: {
          return cb(new Error('too many requests'));
        }
        case 500: {
          // REF console.log('body = ', body);
          return cb(new Error('internal server error'));
        }
        case 503: {
          return cb(new Error('service unavailable'));
        }
        default: {
          return cb(new Error('unrecognized http status code: ' +
            httpReq.statusCode));
        }
      }

      try {
        if ('string' === typeof body) {
          body = JSON.parse(body);
        }
      } catch (e) {
        return cb(new Error('unreadable data'));
      }

      if (body && body.objects) {
        body = body.objects;
      }

      cb(err, body);
    });
  };

  // API Methods
  // Accounts

  /**
   * Get the account entity fields metadata
   * @param  {Function} cb Callback
   */
  SalesforceIQ.prototype.getAccountFields = function(cb) {
    makeRequest('accounts/fields', {}, cb);
  };

  /**
   * Create a new account in SalesforceIQ
   * @param  {Object}   account The account to be created
   * @param  {Function} cb      Callback
   */
  SalesforceIQ.prototype.createAccount = function(account, cb) {
    if (!account.name) { return cb(new Error('Name is required')); }

    makeRequest('accounts', {
      method: 'POST',
      json: account
    }, cb);
  };

  /**
   * Get all accounts from SalesforceIQ
   * @param  {string}   queryString A query string like _start=0&limit=50
   * @param  {Function} cb Callback
   */
  SalesforceIQ.prototype.getAccounts = function(queryString, cb) {
    makeRequest('accounts?' + queryString, {}, cb);
  };

  /**
   * Get an account from SalesforceIQ by ID
   * @param  {string}   accountId The SalesforceIQ ID to lookup
   * @param  {Function} cb        Callback
   */
  SalesforceIQ.prototype.getAccount = function(accountId, cb) {
    makeRequest('accounts/' + accountId, {}, cb);
  };

  /**
   * Update an account in SalesforceIQ by ID
   * @param  {string}   accountId The SalesforceIQ ID of the account to update
   * @param  {Object}   account The account object to update SalesforceIQ with
   * @param  {Function} cb      Callback
   */
  SalesforceIQ.prototype.updateAccount = function(accountId, account, cb) {
    if (!account.name) { return cb(new Error('Name is required')); }

    makeRequest('accounts/' + accountId, {
      method: 'PUT',
      json: account
    }, cb);
  };

  /**
   * Delete an account in SalesforceIQ
   * @param  {string}   accountId The SalesforceIQ ID of the account to delete
   * @param  {Function} cb        Callback
   */
  SalesforceIQ.prototype.deleteAccount = function(accountId, cb) {
    var req = {
      method: 'DELETE'
    };
    makeRequest('accounts/' + accountId, req, cb);
  };

  // Contacts

  /**
   * Create a new contact in SalesforceIQ
   * @param  {Object}   contact The contact object to create
   * @param  {Function} cb      Callback
   */
  SalesforceIQ.prototype.createContact = function(contact, cb) {
    if (!contact.name) { return cb(new Error('Name is required')); }

    contact = _.pick(contact, [
      'name',
      'email',
      'phone',
      'address',
      'company',
      'title'
    ]);

    _.each(contact, function(values, key) {
      if (Array.isArray(values)) {
        values = _.map(values, function(value) {
          return {
            value: value
          };
        });
      } else if ('string' === typeof values) {
        values = [{
          value: values
        }];
      } else {
        return; // Unrecognized
      }

      contact[key] = values;
    });

    makeRequest('contacts', {
      method: 'POST',
      json: {
        properties: contact
      }
    }, cb);
  };

  /**
   * Get all contacts from SalesforceIQ
   * @param  {string}   queryString A query string like _start=0&limit=50
   * @param  {Function} cb          Callback
   */
  SalesforceIQ.prototype.getContacts = function(queryString, cb) {
    makeRequest('contacts?' + queryString, {}, cb);
  };

  /**
   * Get a contact from SalesforceIQ by ID
   * @param  {string}   contactId The SalesforceIQ ID of the contact to find
   * @param  {Function} cb        Callback
   */
  SalesforceIQ.prototype.getContact = function(contactId, cb) {
    makeRequest('contacts/' + contactId, {}, cb);
  };

  /**
   * Get a contact from SalesforceIQ by Email
   * @param  {string}   email Email address to search by
   * @param  {Function} cb    Callback
   */
  SalesforceIQ.prototype.getContactByEmail = function(email, cb) {
    makeRequest('contacts?properties.email=' + email, {}, cb);
  };

  /**
   * Update/Insert a contact into SalesforceIQ by contact email
   * @param  {Object}   contact The contact object to update/insert
   * @param  {Function} cb      Callback
   */
  SalesforceIQ.prototype.upsertContact = function(contact, cb) {
    if (!contact.name) { return cb(new Error('Name is required')); }

    contact = _.pick(contact, [
      'name',
      'email',
      'phone',
      'address',
      'company',
      'title'
    ]);

    _.each(contact, function(values, key) {
      if (Array.isArray(values)) {
        values = _.map(values, function(value) {
          return {
            value: value
          };
        });
      } else if ('string' === typeof values) {
        values = [{
          value: values
        }];
      } else {
        return; // Unrecognized
      }

      contact[key] = values;
    });

    makeRequest('contacts/?_upsert=email', {
      method: 'POST',
      json: {
        properties: contact
      }
    }, cb);
  };

  /**
   * Update a contact in SalesforceIQ by ID
   * @param  {string}   contactId The SalesforceIQ ID of the contact to update
   * @param  {Object}   contact   The contact objet to send
   * @param  {Function} cb        Callback
   */
  SalesforceIQ.prototype.updateContact = function(contactId, contact, cb) {
    if (!contact.name) { return cb(new Error('Name is required')); }

    contact = _.pick(contact, [
      'name',
      'email',
      'phone',
      'address',
      'company',
      'title'
    ]);

    _.each(contact, function(values, key) {
      if (Array.isArray(values)) {
        values = _.map(values, function(value) {
          return {
            value: value
          };
        });
      } else if ('string' === typeof values) {
        values = [{
          value: values
        }];
      } else {
        return; // Unrecognized
      }

      contact[key] = values;
    });

    makeRequest('contacts/' + contactId, {
      method: 'PUT',
      json: {
        id: contactId,
        properties: contact
      }
    }, cb);
  };

  // NJC this does not work.  IQ has 'archive' in UI not in API
  SalesforceIQ.prototype.deleteContact = function(contactid, cb) {
    var req = {
      method: 'DELETE'
    };
    makeRequest('contacts/' + contactid, req, cb);
  };

  // Lists

  // DG: this does not seem to work. The documentation suggests
  // that you should be able to create and destroy lists
  // but... apparently not
  /**
   * Create a list in SalesforceIQ
   * @param  {Function} cb Callback
   */
  SalesforceIQ.prototype.createList = function(list, cb) {
    if (!list.title) { return cb(new Error('title is required')); }

    makeRequest('lists/', {
      method: 'POST',
      json: list
    }, cb);
  };


  /**
   * Get all lists from SalesforceIQ
   * @param  {Function} cb Callback
   */
  SalesforceIQ.prototype.getLists = function(cb) {
    makeRequest('lists', {}, cb);
  };

  /**
   * Get a list from SalesforceIQ by ID
   * @param  {string}   listId The SalesforceIQ ID of the list to find
   * @param  {Function} cb     Callback
   */
  SalesforceIQ.prototype.getList = function(listId, cb) {
    makeRequest('lists/' + listId, {}, cb);
  };

  /**
   * Get items from a list in SalesforceIQ
   * @param  {string}   listId      The SalesforceIQ Id of the list to query
   * @param  {string}   queryString A query string like _start=0&limit=50
   * @param  {Function} cb          Callback
   */
  SalesforceIQ.prototype.getListItems = function(listId, queryString,cb) {
    makeRequest('lists/' + listId + '/listitems?' + queryString, {}, cb);
  };

  /**
   * Get a list item from a list in SalesforceIQ by id
   * @param  {string}   listId     The SalesforceIQ ID of the list to query
   * @param  {string}   listItemId The SalesforceIQ ID of the list item to find
   * @param  {Function} cb         Callback
   */
  SalesforceIQ.prototype.getListItem = function(listId, listItemId, cb) {
    makeRequest('lists/' + listId + '/listitems/' + listItemId, {}, cb);
  };

  /**
   * Get list items from SalesforceIQ for a contact
   * @param  {string}   listId     The SalesforceIQ ID of the list to query
   * @param  {Array}   contactIds An array of SalesforceIQ IDs for the contacts querying for
   * @param  {Function} cb         Callback
   */
  SalesforceIQ.prototype.getListItemsByContactId = function(listId, contactIds, cb) {
    contactIds = [].concat(contactIds);
    makeRequest('lists/' + listId + '/listitems?contactIds=' +
      contactIds.join(','), {}, cb);
  };

  SalesforceIQ.prototype.createListItem = function(listId, listItem, cb) {
    if (!listItem.accountId && !listItem.contactIds) {
      return cb(new Error('accountId or contactIds is required'));
    }
    listItem = _.pick(listItem, [
      'accountId',
      'listId',
      'contactIds',
      'name',
      'fieldValues',
      'fields',
      'linkedItemIds'
    ]);
    var req = {
      method: 'POST',
      json: listItem
    };
    // REF console.log('making request, listItem %j', listItem);
    // REF console.log('URL: lists/' + listId + '/listitems');

    makeRequest('lists/' + listId + '/listitems', req, cb);
  };

  SalesforceIQ.prototype.updateListItem = function(listId, listItemId, listItem, cb) {
    var req = {
      method: 'PUT',
      json: listItem
    };
    makeRequest('lists/' + listId + '/listitems/' + listItemId, req, cb);
  };

  SalesforceIQ.prototype.removeListItem = function(listId, listItemId, cb) {
    var req = {
      method: 'DELETE'
    };
    makeRequest('lists/' + listId + '/listitems/' + listItemId, req, cb);
  };

  // DG: this does not seem to work. The documentation suggests
  // that you should be able to create and destroy lists
  // but... apparently not
  /**
   * Delete a list in SalesforceIQ
   * @param  {string}   listId The SalesforceIQ ID of the list to delete
   * @param  {Function} cb        Callback
   */
  SalesforceIQ.prototype.deleteList = function(listId, cb) {
    var req = {
      method: 'DELETE'
    };
    makeRequest('lists/' + listId, req, cb);
  };

  // Events

  SalesforceIQ.prototype.createEvent = function(body, cb) {
    var req = {
      method: 'PUT',
      json: body
    };
    makeRequest('events/', req, cb);
  };

  // User

  SalesforceIQ.prototype.getUser = function(userid, cb) {
    makeRequest('users/' + userid, {}, cb);
  };

  return SalesforceIQ;

})();

module.exports = SalesforceIQ;
