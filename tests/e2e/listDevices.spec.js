import { Selector } from 'testcafe';
//import { RequestLogger } from 'testcafe';

fixture `Page Model`
    .page `http://localhost:3001/`;

let responseBody = null;
let sortedData = null;

test('Retrieve list of devices using API call and save response', async t => {
    //Create an API call to retrieve the list of devices
    const response = await t.request({
        url: 'http://localhost:3000/devices',
        method: 'GET'
    });

    // Extract the response body and save it on variable to be used on the other tests.
    responseBody = response.body;

    // Sort the data by system_name property
    sortedData = responseBody.sort((a, b) => {
        const nameA = a.system_name.toLowerCase();
        const nameB = b.system_name.toLowerCase();
        return nameA.localeCompare(nameB);
    });
});

test('Use List of API devices to verify elements on the DOM', async t => {
    // sorting devices by system name
    const dropdown = Selector('#sort_by');
    await t
        .click(dropdown)
        .click(dropdown.find('option[value="system_name"]'));

    // Use a selector to target the container or parent element that holds the list
    const listContainer = Selector('.list-devices');

    // Use a selector to target the individual devices
    const listOfDeviceNames = listContainer.find('.device-name');
    const listOfDeviceTypes = listContainer.find('.device-type');
    const listOfDeviceCapacities = listContainer.find('.device-capacity');

    // get the count of devices
    const listItemCount = await listOfDeviceNames.count;

    // Loop through each device and  perform assertion
    for (let i = 0; i < listItemCount; i++) {
        //Assert Devices from the page are the same as from API response
        await t
            .expect(listOfDeviceNames.nth(i).visible).ok()
            .expect(listOfDeviceNames.nth(i).innerText).contains(responseBody[i]['system_name'])
            .expect(listOfDeviceTypes.nth(i).visible).ok()
            .expect(listOfDeviceTypes.nth(i).innerText).contains(responseBody[i]['type'])
            .expect(listOfDeviceCapacities.nth(i).visible).ok()
            .expect(listOfDeviceCapacities.nth(i).innerText).contains(responseBody[i]['hdd_capacity']);
    }
});


test('Verify that all devices contain the edit and delete buttons.', async t => {
    // Use a selector to target the list of web div elements
    const listOfDevices = Selector('.device-info');

    // loop ove the devices and verify the presence of sibling divs device-options with buttons inside.
    for (let i = 0; i < await listOfDevices.count; i++) {
        const device = listOfDevices.nth(i);

        // Use the sibling() method to target the sibling div elements
        const deviceOptions = device.sibling('div.device-options');

        // get the buttons inside the device-options div
        const editButton = deviceOptions.find('a.device-edit');
        const removeButton = deviceOptions.find('button.device-remove');

        // Assert that edit and remove buttons are present on the page
        await t
            .expect(editButton.exists).ok()
            .expect(editButton.innerText).eql('EDIT')
            .expect(removeButton.exists).ok()
            .expect(removeButton.innerText).eql('REMOVE');
    }

});


test('Verify that devices can be created properly using the UI.', async t => {
    const createNewDeviceButton = Selector('a.submitButton');

    const systemName = Selector('input#system_name');
    const capacity = Selector('input#hdd_capacity');
    const saveButton = Selector('button.submitButton');

    await t
        .click(createNewDeviceButton)
        .typeText(systemName,'My New Device')
        .typeText(capacity,'100')
        .click(saveButton);

    // use selector to get the new device created
    const newDevice = Selector('span').withText('New Device');

    // Assert that the new device created is present on the page
    await t.expect(newDevice.exists).ok('New device should be present on the page');
});

test('Make an API call that renames the first device of the list to "Renamed Device"', async t => {

    //Create an API call to update the first record
    const response = await t.request({
        url: 'http://localhost:3000/devices/e8okoP2l5',
        method: 'PUT',
        body: {
            system_name: "Renamed Device",
        },
    });

    // Refresh the page
    await t.eval(() => location.reload());

    const renamedDevice = Selector('span').withText('Renamed Device');
    await t.expect(renamedDevice.exists).ok('New renamed device should be present on the page');
});

test('Make an API call that deletes the last element of the list.', async t => {

    //Create an API call to create a new the record
    const response1 = await t.request({
        url: 'http://localhost:3000/devices',
        method: 'POST',
        body:  {
            id: "1esV3iKL9",
            system_name: "device to be deleted",
            type: "WINDOWS",
            hdd_capacity: "100"
        }
    });

    //Create an API call to delete the newly created record
    const response = await t.request({
        url: 'http://localhost:3000/devices/1esV3iKL9',
        method: 'DELETE',
    });

    // Refresh the page
    await t.eval(() => location.reload());

    const removedElement = Selector('span').withText('device to be deleted');
    await t.expect(removedElement.exists).notOk('Element should not be present');
});