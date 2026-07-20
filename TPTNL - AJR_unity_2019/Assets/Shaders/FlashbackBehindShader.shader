Shader "Custom/FlashbackBehindShader"
{
    Properties
    {
        _Color ("Flash Color", Color) = (1.0, 1.0, 1.0, 1.0)
        _EdgeSoftness ("Edge Softness", Range(0.01, 0.5)) = 0.1
        _Inset ("Rectangle Inset", Range(0.0, 0.45)) = 0.0
    }
    SubShader
    {
        // Render after opaque objects so the background is ready to be grabbed
        Tags { "RenderType"="Opaque" }
        LOD 100

        // 1. Grab the screen texture behind this quad
        GrabPass
        {
            "_BackgroundTexture"
        }

        Pass
        {
            CGPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            // Required for macro-based instancing variants in VR
            #pragma multi_compile_instancing 
            #include "UnityCG.cginc"

            struct appdata
            {
                float4 vertex : POSITION;
                float2 uv : TEXCOORD0;
                UNITY_VERTEX_INPUT_INSTANCE_ID // 1. Allows the vertex shader to know which eye it is processing
            };

            struct v2f
            {
                float2 uv : TEXCOORD0;
                float4 grabPos : TEXCOORD1;
                float4 vertex : SV_POSITION;
                UNITY_VERTEX_OUTPUT_STEREO     // 2. Passes the eye index from vertex to fragment shader
            };

            // 3. VR Safe macro for declaring the screenspace texture array
            UNITY_DECLARE_SCREENSPACE_TEXTURE(_BackgroundTexture);
            
            fixed4 _Color;
            float _EdgeSoftness;
            float _Inset;

            v2f vert (appdata v)
            {
                v2f o;
                
                // 4. Setup stereo rendering configurations per eye
                UNITY_SETUP_INSTANCE_ID(v);
                UNITY_INITIALIZE_OUTPUT(v2f, o);
                UNITY_INITIALIZE_VERTEX_OUTPUT_STEREO(o);
                
                o.vertex = UnityObjectToClipPos(v.vertex);
                o.uv = v.uv;
                
                // Calculate grab coordinates for screen sampling
                o.grabPos = ComputeGrabScreenPos(o.vertex);
                return o;
            }

            fixed4 frag (v2f i) : SV_Target
            {
                // 5. Setup stereo eye index for the fragment function
                UNITY_SETUP_STEREO_EYE_INDEX_POST_VERTEX(i);

                // Remap UVs from [0, 1] to [-1, 1] to center the coordinate system
                float2 uv = i.uv * 2.0 - 1.0;
                
                // Get the absolute distance from the center for each axis
                float2 d = abs(uv);
                
                // Create a smooth edge transition for both horizontal and vertical axes
                float2 edge = smoothstep(1.0 - _Inset, 1.0 - _Inset - _EdgeSoftness, d);
                
                // Combine the axes. Multiplying them keeps it strictly rectangular.
                float mask = edge.x * edge.y;

                // 6. Convert grab coordinates to standard UV coordinates before sampling
                float2 grabUV = i.grabPos.xy / i.grabPos.w;

                // 7. Use VR safe macro to sample the background texture (handles arrays seamlessly)
                fixed4 bgColor = UNITY_SAMPLE_SCREENSPACE_TEXTURE(_BackgroundTexture, grabUV);

                // Blend between background color and the chosen custom color based on mask
                fixed4 result = lerp(bgColor, _Color, mask);
                
                // Force alpha to 0 as requested
                result.a = 0;

                return result;
            }
            ENDCG
        }
    }
}