function afterGet(inputData) {
  return validationForAfterGet(inputData);
}

function beforePatch(inputData) {
  var data = inputData["data"];
  var action = data["action"];
  var entityPath = data["entityPath"];
  if (action == "copy") {
    return copyDocument(data);
  } else {
    var status = getStatusFromAction(action);

    if (entityPath == "PoLineEv") {
      return beforePatchLine(status, data);
    } else {
      return beforePatchHeader(status, data);
    }
  }
}
function copyDocument(data) {
  var poHeaderId = data["poHeaderId"];
  if (!poHeaderId) {
    return false;
  }
  request = {
    sql:
      "INSERT INTO  po_header " +
      " SELECT NULL,po_document_type, bu_org_id, doc_status, approval_status, currency, doc_currency, ref_po_header_id, release_number, po_number, supplier_id, supplier_site_id, buyer, hr_employee_id, description, ship_to_id, bill_to_id, price_list_header_id, payment_term_id, agreement_start_date, agreement_end_date, exchange_rate_type, exchange_rate, created_by, creation_date, last_updated_by, last_update_date, multi_bu_cb, rev_number, doc_number" +
      " from po_header where po_header_id = '" +
      poHeaderId +
      "' ",
    dbType: "MySQL",
    connName: "Inoerp",
  };
  let response = sqlInsert(request);

  let responseData = response["data"];
  let firstRow = responseData[0];
  if (firstRow) {
    var newPoHeaderId = firstRow["lastInsertId"];
    //Copy all lines
    request = {
      sql:
        " SELECT pl.* " +
        " from po_line pl,po_header ph" +
        " where ph.po_header_id = pl.po_header_id AND ph.po_header_id = '" +
        poHeaderId +
        "' ",
      dbType: "MySQL",
      connName: "Inoerp",
    };
    let response = sqlSelect(request);

    let lineData = response["data"];
    isArray = lineData.constructor === Array ? true : false;

    if (isArray) {
      for (let i = 0; i < lineData.length; i++) {
        const line = lineData[i];
        let poLineId = line["poLineId"];
      }
    }
  }

  var retDataMap = {
    rd_proceed_status: false,
    rd_proceed_message:
      "Copy action is successfully completed. New poHeaderId " + newPoHeaderId,
  };
  return retDataMap;
}

function copyPoLines(poLineId, newPoHeaderId) {
  request = {
    sql:
      " INSERT INTO  po_line " +
      " SELECT NULL, " +
      newPoHeaderId +
      ", line_number, bpa_line_id, receving_org_id, inv_item_master_id, revision_name, product_description, line_quantity, price_list_header_id, price_date, unit_price, line_price, tax_code, tax_amount, gl_line_price, gl_tax_amount, exchange_rate, reference_doc_type, reference_doc_number, line_type, line_description, uom_code, kit_configured_cb, hold_cb, kit_cb, line_discount_amount, doc_status, approval_status, ship_to_id, created_by, creation_date, last_updated_by, last_update_date, rev_enabled_cb, rev_number, discount_code " +
      " from po_line where po_line_id = '" +
      poLineId +
      "' ",
    dbType: "MySQL",
    connName: "Inoerp",
  };
  let response = sqlInsert(request);
  let responseData = response["data"];
  let firstRow = responseData[0];
  if (firstRow) {
    let newPoLineId = firstRow["lastInsertId"];
    request = {
      sql:
        " INSERT INTO  po_detail" +
        " SELECT NULL, " +
        newPoLineId +
        ", " +
        newPoHeaderId +
        ", shipment_number, sub_inventory, locator_id, invoice_match_type, requestor, ship_to_location_id, uom_code, quantity, need_by_date, promise_date, charge_ac_id, accrual_ac_id, budget_ac_id, ppv_ac_id, received_quantity, accepted_quantity, delivered_quantity, invoiced_quantity, paid_quantity, ef_id, status, created_by, creation_date, last_updated_by, last_update_date " +
        " from po_detail where po_line_id = '" +
        poLineId +
        "' ",
      dbType: "MySQL",
      connName: "Inoerp",
    };
    sqlInsert(request);
  }
}

function beforePatchHeader(status, data) {
  if (status !== null) {
    request = {
      sql:
        "UPDATE po_header SET doc_status = '" +
        status +
        "' WHERE po_header_id = '" +
        data["poHeaderId"] +
        "' ",
      dbType: "MySQL",
      connName: "Inoerp",
    };
    let response = sqlUpdate(request);
    request = {
      sql:
        "UPDATE po_line SET doc_status = '" +
        status +
        "' WHERE po_header_id = '" +
        data["poHeaderId"] +
        "' ",
      dbType: "MySQL",
      connName: "Inoerp",
    };
    response = sqlUpdate(request);
    if (response != null) {
      //      printNestedObject(response);
    }
  }
}

function beforePatchLine(status, data) {
  if (status !== null) {
    request = {
      sql:
        "UPDATE po_line SET doc_status = '" +
        status +
        "' WHERE po_header_id = '" +
        data["poHeaderId"] +
        "' ",
      dbType: "MySQL",
      connName: "Inoerp",
    };
    response = sqlUpdate(request);
    if (response != null) {
      //      printNestedObject(response);
    }
  }
}
