import { useState, useCallback } from "react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  useActionData,
  useNavigation,
  useSubmit,
  useLoaderData,
} from "@remix-run/react";
import { Page, Card, Button } from "@shopify/polaris";
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
  console.log("running");
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
        checkoutProfileId: "${firstNodeId}"
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
  const [faviconValue, setFavicon] = useState("");
  const [fileName, setFileName] = useState("");
  const checkoutProfilesObj = useLoaderData<typeof loader>();
  console.log(checkoutProfilesObj);

  const submit = useSubmit();

  const submitFavicon = () =>
    submit({ faviconValue, fileName }, { replace: true, method: "POST" });

  return (
    <Page>
      Havaianas Checkout App
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
            <Button size="medium" onClick={submitFavicon}>
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
