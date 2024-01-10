import { useState, useCallback, useEffect } from "react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  useActionData,
  useNavigation,
  useSubmit,
  useLoaderData,
} from "@remix-run/react";
import { Page, Card, Button, Select } from "@shopify/polaris";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  let checkoutProfiles = await admin.graphql(
    `#graphql
    query getCheckoutProfiles {
    checkoutProfiles(first: 10){
      edges{
        node{
          name
          id
        }
      }
    }
  }
   `,
  );
  let checkoutProfilesData = await checkoutProfiles.json();
  let checkoutProfilesArray = checkoutProfilesData.data.checkoutProfiles.edges;
  return json({ checkoutProfilesArray });
};

export async function action({ request }) {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const selectedCheckoutProfile = formData.get("selectedCheckoutProfile");
  const getFaviconGID = await admin.graphql(
    `#graphql
      query GetFaviconID {
      files(query: "favicon", first: 1) {
        edges {
          node {
            id
          }
        }
      }
    }
    `,
  );

  let getFaviconGIDResponse = await getFaviconGID.json();
  console.log(
    "Favicon ID: ",
    getFaviconGIDResponse.data.files.edges[0].node.id,
  );

  let faviconId = getFaviconGIDResponse.data.files.edges[0].node.id;

  const response = await admin.graphql(
    `#graphql
    query checkoutProfiles {
      checkoutProfiles(first: 10) {
        nodes {
          id
          isPublished
        }
      }
    }`,
  );
  const data = await response.json();
  const firstNodeId = data.data.checkoutProfiles.nodes[0].id;
  console.log(data.data.checkoutProfiles.nodes[0].id);
  console.log(firstNodeId, "first node id");

  const insertFaviconResponse = await admin.graphql(
    `#graphql
      mutation checkoutBrandingUpsert{
        checkoutBrandingUpsert(
        checkoutProfileId: "${selectedCheckoutProfile}"
        checkoutBrandingInput:{ customizations: { favicon: { mediaImageId: "${faviconId}" } } }
        ){
          checkoutBranding{
            customizations{
              favicon{
                image{
                  url
                }
              }
            }
          }
          userErrors {
            field
            message
          }
        }
      }   
    `,
  );

  const insertFaviconData = await insertFaviconResponse.json();
  console.log(
    insertFaviconData.data.checkoutBrandingUpsert.checkoutBranding
      .customizations,
    "last console log",
  );

  return json({
    message: "Image sync commencing. Please wait for success message",
    success: true,
  });
}

export default function Index() {
  const [checkoutProfiles, setCheckoutProfiles] = useState([]);
  const [selectedCheckoutProfile, setSelected] = useState("");
  const checkoutProfilesObj = useLoaderData();
  const submit = useSubmit();

  useEffect(() => {
    (function createCheckoutProfilesArray() {
      let checkoutProfilesArray = [];
      for (
        let i = 0;
        i < checkoutProfilesObj.checkoutProfilesArray.length;
        i++
      ) {
        checkoutProfilesArray.push({
          label: checkoutProfilesObj.checkoutProfilesArray[i].node.name,
          value: checkoutProfilesObj.checkoutProfilesArray[i].node.id,
        });
      }
      setSelected(checkoutProfilesArray[0].value);
      setCheckoutProfiles(checkoutProfilesArray);
    })();
  }, []);

  const handleSelectChange = useCallback(
    (value: string) => setSelected(value),
    [],
  );

  const applyFavicon = () =>
    submit({ selectedCheckoutProfile }, { replace: true, method: "POST" });

  console.log(checkoutProfiles, "checkout profiles 2");
  console.log(selectedCheckoutProfile, "selected");

  return (
    <Page>
      Havaianas Checkout App
      <Card>
        <Select
          label="Checkout Profiles (select which one to apply changes to)"
          options={checkoutProfiles}
          onChange={handleSelectChange}
          value={selectedCheckoutProfile}
        />
      </Card>
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              flexDirection: "column",
            }}
          >
            <h1>Add Favicon to Checkout</h1>
            <p>
              Upload an image to the store's Files, and name it "Favicon". Then,
              press the "Add Favicon" Button to apply it to your checkout
            </p>
            <Button size="medium" onClick={applyFavicon}>
              Add Favicon to Checkout
            </Button>
          </div>
          <div>
            <img
              src="https://cdn-icons-png.flaticon.com/512/972/972623.png"
              style={{ width: "100px" }}
            />
          </div>
        </div>
      </Card>
    </Page>
  );
}
